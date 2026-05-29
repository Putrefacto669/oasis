from fastapi import APIRouter

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/ocupacion-historica")
async def get_historical_occupancy():
    return {"message": "Ocupación histórica"}
