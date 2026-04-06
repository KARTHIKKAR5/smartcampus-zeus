"""
The Last Meal Mile — FastAPI Main Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import auth_router, menu_router, orders_router, analytics_router, chat_router

app = FastAPI(
    title="The Last Meal Mile API",
    description="Campus food delivery system for SR University",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router.router)
app.include_router(menu_router.router)
app.include_router(orders_router.router)
app.include_router(analytics_router.router)
app.include_router(chat_router.router)


@app.get("/")
async def root():
    return {
        "service": "The Last Meal Mile",
        "university": "SR University",
        "version": "1.0.0",
        "status": "running 🚀",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
