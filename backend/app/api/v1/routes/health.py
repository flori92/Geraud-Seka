from fastapi import APIRouter

router = APIRouter()


@router.get("", summary="Etat de santé du backend")
def get_health() -> dict[str, str]:
    return {"status": "ok"}
