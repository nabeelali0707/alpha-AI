from fastapi import APIRouter, Depends
from utils.auth import get_current_user

router = APIRouter()


@router.get("/me")
async def me(user=Depends(get_current_user)):
    return {"user": user}


@router.get("/protected-test")
async def protected_test(user=Depends(get_current_user)):
    return {"ok": True, "id": user.get("id"), "email": user.get("email")}
