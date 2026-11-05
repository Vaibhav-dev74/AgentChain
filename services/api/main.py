"""
AgentChain AI - FastAPI Main Application Entrypoint
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import init_db
from app.api.v1.auth import router as auth_router
from app.api.v1.agents import router as agents_router
from app.api.v1.policies import router as policies_router
from app.api.v1.proposals import router as proposals_router
from app.api.v1.explorer import router as explorer_router
from app.api.v1.analytics import router as analytics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed initial administrator & policies
    init_db()
    yield


app = FastAPI(
    title="AgentChain AI API",
    description="AI-Powered Blockchain Automation & Verifiable Agent Execution Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 Routers
api_v1_prefix = "/api/v1"
app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(agents_router, prefix=api_v1_prefix)
app.include_router(policies_router, prefix=api_v1_prefix)
app.include_router(proposals_router, prefix=api_v1_prefix)
app.include_router(explorer_router, prefix=api_v1_prefix)
app.include_router(analytics_router, prefix=api_v1_prefix)


@app.get("/", tags=["Health"])
def root():
    return {
        "name": "AgentChain AI API",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
        "chainId": settings.CHAIN_ID,
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "contractsConfigured": bool(settings.ACTION_LEDGER_ADDRESS),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)
