from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import auth, reading, listening, writing, speaking, admin, analytics

app = FastAPI(title="BandUp API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(reading.router, prefix="/reading", tags=["Reading"])
app.include_router(listening.router, prefix="/listening", tags=["Listening"])
app.include_router(writing.router, prefix="/writing", tags=["Writing"])
app.include_router(speaking.router, prefix="/speaking", tags=["Speaking"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])

@app.get("/")
def root():
    return {"message": "BandUp API is running"}