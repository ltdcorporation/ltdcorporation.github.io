from pydantic import BaseModel, Field


class HitRequest(BaseModel):
    namespace: str = Field(..., min_length=1, max_length=128, description="Logical bucket, e.g. asiafap.com")
    visitor_id: str = Field(..., min_length=8, max_length=64, description="Anonymous fingerprint for throttling/unique count")
    increment: int = Field(1, ge=1, le=10, description="How many hits to add")


class CounterResponse(BaseModel):
    namespace: str
    value: int
    today: int
    unique_today: int
    throttled: bool = False
