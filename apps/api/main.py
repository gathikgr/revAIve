"""
revAIve — FastAPI Backend Application Entrypoint
Autonomous Revenue Recovery for Razorpay merchants.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from packages.database.session import engine
from packages.database.models import Base
from apps.api.routes.webhooks import router as webhooks_router
from apps.api.routes.opportunities import router as opportunities_router
from apps.api.routers.policy_lab import router as policy_lab_router
from apps.api.routers.demo import router as demo_router
from apps.api.routers.agent_studio import router as agent_studio_router
from apps.api.routers.auth import router as auth_router

# Initialize database schema tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="revAIve API",
    description="Autonomous Revenue Recovery for Razorpay merchants",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Route Handlers
app.include_router(webhooks_router)
app.include_router(opportunities_router)
app.include_router(policy_lab_router, prefix="/api/v1")
app.include_router(demo_router, prefix="/api/v1")
app.include_router(agent_studio_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "product": "revAIve",
        "tagline": "Bring lost revenue back.",
        "track": "Track 03 — AI Revenue Recovery"
    }
