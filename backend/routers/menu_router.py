"""
FastAPI Router: Menu & Canteen
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from database import get_supabase
from auth import get_current_user, require_role

router = APIRouter(prefix="/menu", tags=["menu"])


class MenuItemCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    category: str
    canteen_id: str
    is_available: bool = True
    image_url: str = ""
    prep_time_minutes: int = 10


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    is_available: Optional[bool] = None
    prep_time_minutes: Optional[int] = None


@router.get("/canteens")
async def list_canteens():
    db = get_supabase()
    result = db.table("canteens").select("*").execute()
    return result.data


@router.get("/items")
async def list_menu_items(canteen_id: Optional[str] = None, category: Optional[str] = None):
    db = get_supabase()
    query = db.table("menu_items").select("*").eq("is_available", True)
    if canteen_id:
        query = query.eq("canteen_id", canteen_id)
    if category:
        query = query.eq("category", category)
    result = query.execute()
    return result.data


@router.post("/items")
async def create_menu_item(item: MenuItemCreate, user=Depends(require_role("canteen_owner", "admin"))):
    db = get_supabase()
    result = db.table("menu_items").insert(item.dict()).execute()
    return result.data[0]


@router.patch("/items/{item_id}")
async def update_menu_item(item_id: str, update: MenuItemUpdate, user=Depends(require_role("canteen_owner", "admin"))):
    db = get_supabase()
    data = {k: v for k, v in update.dict().items() if v is not None}
    result = db.table("menu_items").update(data).eq("id", item_id).execute()
    return result.data[0]


@router.delete("/items/{item_id}")
async def delete_menu_item(item_id: str, user=Depends(require_role("canteen_owner", "admin"))):
    db = get_supabase()
    db.table("menu_items").delete().eq("id", item_id).execute()
    return {"message": "Deleted"}
