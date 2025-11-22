from fastapi import APIRouter

from app.api.v1.routes import auth, health, documents, dashboard, clients, activities, products, exports, analytics, crm, bot, hr

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(health.router, prefix="", tags=["health"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(activities.router, prefix="/activities", tags=["activities"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(exports.router, prefix="/exports", tags=["exports"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(crm.router, prefix="/crm", tags=["crm"])
api_router.include_router(bot.router, prefix="/bot", tags=["bot"])
api_router.include_router(hr.router, prefix="/hr", tags=["hr"])
