from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from App.routers import reports, analytics, export

app = FastAPI(title="Oasis Traveler API", description="API para gestión hotelera", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "https://*.cloudflarepages.net"],
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

@app.get("/health")
async def health_check():
    return {"status": "healthy"}