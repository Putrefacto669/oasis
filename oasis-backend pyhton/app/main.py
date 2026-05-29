from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import reports, analytics, export

app = FastAPI(title="Oasis Traveler API")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(reports.router)
app.include_router(analytics.router)
app.include_router(export.router)

@app.get("/")
async def root():
    return {"message": "Oasis Traveler API", "status": "running"}