import hashlib
import logging
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from .config import get_settings
from .db import engine, session_scope, ensure_schema
from .schemas import HitRequest, CounterResponse

THROTTLE_SECONDS = 10
LOCAL_TZ = timezone(timedelta(hours=7))  # Asia/Jakarta

allowed_origins = [
    "https://asiafap.com",
    "https://www.asiafap.com",
    "https://ltdcorporation.github.io",
    "https://ltdcorporation.github.io/ltdcorporation.github.io",
    "http://localhost:4173",
    "http://localhost:5173",
]

logger = logging.getLogger("visitor_counter")

app = FastAPI(title="LTD Visitor Counter", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

settings = get_settings()
ensure_schema()

UPSERT_SQL = text(
    """
    INSERT INTO counters(namespace, count)
    VALUES (:namespace, :inc)
    ON CONFLICT (namespace)
    DO UPDATE SET count = counters.count + :inc, updated_at = NOW();
    """
)
SELECT_SQL = text("SELECT count FROM counters WHERE namespace = :namespace")
DAILY_UPSERT_SQL = text(
    """
    INSERT INTO daily_stats(namespace, day, total, unique_hits)
    VALUES (:namespace, :day, :inc, 0)
    ON CONFLICT (namespace, day)
    DO UPDATE SET total = daily_stats.total + :inc;
    """
)
INSERT_UNIQUE_SQL = text(
    """
    INSERT INTO visitor_uniques(namespace, day, visitor_hash)
    VALUES (:namespace, :day, :hash)
    ON CONFLICT DO NOTHING;
    """
)
UPDATE_UNIQUE_SQL = text(
    "UPDATE daily_stats SET unique_hits = unique_hits + 1 WHERE namespace=:namespace AND day=:day;"
)
SELECT_DAILY_SQL = text(
    "SELECT total, unique_hits FROM daily_stats WHERE namespace=:namespace AND day=:day"
)
SELECT_ACTIVITY_SQL = text(
    "SELECT last_hit FROM visitor_activity WHERE visitor_hash=:hash FOR UPDATE"
)
INSERT_ACTIVITY_SQL = text(
    "INSERT INTO visitor_activity (visitor_hash, last_hit) VALUES (:hash, :now)"
)
UPDATE_ACTIVITY_SQL = text(
    "UPDATE visitor_activity SET last_hit=:now WHERE visitor_hash=:hash"
)


def _normalize_namespace(namespace: str) -> str:
    return namespace.strip().lower()


def _hash_visitor(namespace: str, visitor_id: str) -> str:
    raw = f"{namespace}:{visitor_id}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def _current_day() -> datetime.date:
    return datetime.now(LOCAL_TZ).date()


def _current_ts() -> datetime:
    return datetime.now(timezone.utc)


def _fetch_totals(conn, namespace: str, day: datetime.date):
    total = conn.execute(SELECT_SQL, {"namespace": namespace}).scalar() or 0
    day_row = conn.execute(SELECT_DAILY_SQL, {"namespace": namespace, "day": day}).fetchone()
    today = day_row[0] if day_row else 0
    unique_today = day_row[1] if day_row else 0
    return total, today, unique_today


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/hit", response_model=CounterResponse)
def hit_counter(payload: HitRequest, request: Request):
    namespace = _normalize_namespace(payload.namespace)
    visitor_id = payload.visitor_id.strip() or request.headers.get("cf-ray") or request.client.host or "anon"
    visitor_hash = _hash_visitor(namespace, visitor_id)
    day = _current_day()
    now_ts = _current_ts()
    throttled = False

    try:
        with engine.begin() as conn:
            prev = conn.execute(SELECT_ACTIVITY_SQL, {"hash": visitor_hash}).scalar_one_or_none()
            if prev:
                throttled = (now_ts - prev).total_seconds() < THROTTLE_SECONDS
                conn.execute(UPDATE_ACTIVITY_SQL, {"hash": visitor_hash, "now": now_ts})
            else:
                conn.execute(INSERT_ACTIVITY_SQL, {"hash": visitor_hash, "now": now_ts})

            if not throttled:
                conn.execute(UPSERT_SQL, {"namespace": namespace, "inc": payload.increment})
                conn.execute(DAILY_UPSERT_SQL, {"namespace": namespace, "day": day, "inc": payload.increment})
                unique_inserted = conn.execute(
                    INSERT_UNIQUE_SQL, {"namespace": namespace, "day": day, "hash": visitor_hash}
                ).rowcount > 0
                if unique_inserted:
                    conn.execute(UPDATE_UNIQUE_SQL, {"namespace": namespace, "day": day})

            total, today, unique_today = _fetch_totals(conn, namespace, day)
    except SQLAlchemyError as exc:
        logger.exception("Database error during hit_counter")
        raise HTTPException(status_code=500, detail="database_error") from exc

    return CounterResponse(
        namespace=namespace,
        value=total,
        today=today,
        unique_today=unique_today,
        throttled=throttled,
    )


@app.get("/count/{namespace}", response_model=CounterResponse)
def get_counter(namespace: str):
    normalized = _normalize_namespace(namespace)
    day = _current_day()
    try:
        with session_scope() as session:
            total, today, unique_today = _fetch_totals(session, normalized, day)
    except SQLAlchemyError as exc:
        logger.exception("Database error when reading counter")
        raise HTTPException(status_code=500, detail="database_error") from exc
    if total == 0 and today == 0:
        raise HTTPException(status_code=404, detail="counter_not_found")
    return CounterResponse(namespace=normalized, value=total, today=today, unique_today=unique_today)


@app.get("/stats/{namespace}", response_model=CounterResponse)
def read_stats(namespace: str):
    return get_counter(namespace)


@app.get("/")
async def root():
    return JSONResponse(
        {
            "service": app.title,
            "version": app.version,
            "endpoints": ["POST /hit", "GET /count/{namespace}", "GET /stats/{namespace}", "GET /health"],
        }
    )
