from pydantic import BaseModel, Field

class HitRequest(BaseModel):
    namespace: str = Field(..., min_length=1, max_length=128, description="Logical bucket, e.g. asiafap.com")
    increment: int = Field(1, ge=1, le=1000, description="How many hits to add")

class CounterResponse(BaseModel):
    namespace: str
    value: int
