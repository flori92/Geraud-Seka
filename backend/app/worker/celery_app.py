from celery import Celery

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "seka-worker",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.result_expires = 3600
celery_app.conf.task_routes = {
    "app.worker.tasks.*": {"queue": "seka-default"},
}
