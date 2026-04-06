"""
FastAPI Router: Orders + Batch Engine + Dijkstra Assignment
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from database import get_supabase
from auth import get_current_user, require_role
from graph import dijkstra_shortest_path, calculate_delivery_fee, batch_orders_by_location, CAMPUS_NODES
from qr_service import generate_qr_for_order

router = APIRouter(prefix="/orders", tags=["orders"])


class OrderItem(BaseModel):
    menu_item_id: str
    quantity: int
    name: str
    price: float


class PlaceOrderRequest(BaseModel):
    canteen_id: str
    canteen_location: str   # campus node id e.g. "central_canteen"
    delivery_location: str  # campus node id e.g. "block_a"
    items: List[OrderItem]
    urgent: bool = False


class RatingRequest(BaseModel):
    order_id: str
    food_rating: float      # 1-5
    speed_rating: float     # 1-5
    comment: str = ""


@router.post("/place")
async def place_order(req: PlaceOrderRequest, user=Depends(require_role("student"))):
    db = get_supabase()
    student_id = user["sub"]

    # Validate locations
    if req.canteen_location not in CAMPUS_NODES or req.delivery_location not in CAMPUS_NODES:
        raise HTTPException(400, "Invalid campus location")

    # Dijkstra route calculation
    route = dijkstra_shortest_path(req.canteen_location, req.delivery_location)
    if route["distance_meters"] < 0:
        raise HTTPException(400, "No route found between locations")

    total_item_cost = sum(i.price * i.quantity for i in req.items)
    delivery_fee = calculate_delivery_fee(route["distance_meters"], req.urgent)
    total_amount = round(total_item_cost + delivery_fee, 2)

    # Check wallet balance
    student = db.table("users").select("wallet_balance").eq("id", student_id).execute()
    if not student.data or student.data[0]["wallet_balance"] < total_amount:
        raise HTTPException(400, "Insufficient wallet balance")

    # Deduct wallet
    db.table("users").update({"wallet_balance": student.data[0]["wallet_balance"] - total_amount})\
        .eq("id", student_id).execute()

    order_id = str(uuid.uuid4())
    qr_code = generate_qr_for_order(order_id)

    # Find available runner closest to canteen
    runners = db.table("users").select("id,location,name").eq("role", "runner").eq("is_active", True).execute()
    assigned_runner = None
    if runners.data:
        # Pick first available runner (can be improved with proximity sorting)
        assigned_runner = runners.data[0]["id"]

    order_data = {
        "id": order_id,
        "student_id": student_id,
        "canteen_id": req.canteen_id,
        "canteen_location": req.canteen_location,
        "delivery_location": req.delivery_location,
        "items": [i.dict() for i in req.items],
        "total_item_cost": total_item_cost,
        "delivery_fee": delivery_fee,
        "total_amount": total_amount,
        "urgent": req.urgent,
        "route_path": route["path"],
        "route_distance": route["distance_meters"],
        "qr_code": qr_code,
        "runner_id": assigned_runner,
        "status": "pending",
        "payment_status": "paid",
    }

    result = db.table("orders").insert(order_data).execute()

    # Check batch: same delivery location, pending orders
    pending = db.table("orders").select("id,delivery_location").eq("delivery_location", req.delivery_location)\
        .eq("status", "pending").execute()
    batch_info = None
    if len(pending.data) > 1:
        batch_info = {
            "batched": True,
            "orders_in_batch": len(pending.data),
            "message": f"Batched with {len(pending.data)-1} other order(s) going to {CAMPUS_NODES[req.delivery_location]['label']}"
        }

    return {
        "order": result.data[0],
        "route": route,
        "batch_info": batch_info,
        "message": "Order placed successfully! Payment deducted from wallet."
    }


@router.get("/my-orders")
async def my_orders(user=Depends(require_role("student"))):
    db = get_supabase()
    result = db.table("orders").select("*").eq("student_id", user["sub"])\
        .order("created_at", desc=True).execute()
    return result.data


@router.get("/runner-orders")
async def runner_orders(user=Depends(require_role("runner"))):
    db = get_supabase()
    result = db.table("orders").select("*").eq("runner_id", user["sub"])\
        .in_("status", ["pending", "accepted", "picked_up"]).execute()
    return result.data


@router.get("/canteen-orders")
async def canteen_orders(canteen_id: str, user=Depends(require_role("canteen_owner", "admin"))):
    db = get_supabase()
    result = db.table("orders").select("*").eq("canteen_id", canteen_id)\
        .in_("status", ["pending", "accepted", "preparing", "ready"]).execute()
    return result.data


@router.patch("/{order_id}/status")
async def update_order_status(order_id: str, status: str, user=Depends(get_current_user)):
    valid_statuses = ["accepted", "preparing", "ready", "picked_up", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(400, f"Invalid status. Use: {valid_statuses}")

    db = get_supabase()
    result = db.table("orders").update({"status": status}).eq("id", order_id).execute()
    return result.data[0]


@router.post("/{order_id}/verify-qr")
async def verify_qr(order_id: str, payload: dict, user=Depends(require_role("runner"))):
    from qr_service import verify_qr_payload
    scanned = payload.get("scanned_data", "")
    if verify_qr_payload(scanned, order_id):
        db = get_supabase()
        db.table("orders").update({"status": "delivered", "qr_verified": True}).eq("id", order_id).execute()
        return {"verified": True, "message": "Delivery confirmed! ✅"}
    return {"verified": False, "message": "QR mismatch ❌"}


@router.post("/rate")
async def rate_order(req: RatingRequest, user=Depends(require_role("student"))):
    db = get_supabase()
    db.table("ratings").insert({
        "order_id": req.order_id,
        "student_id": user["sub"],
        "food_rating": req.food_rating,
        "speed_rating": req.speed_rating,
        "comment": req.comment,
    }).execute()

    # Update runner average rating
    order = db.table("orders").select("runner_id").eq("id", req.order_id).execute()
    if order.data and order.data[0].get("runner_id"):
        runner_id = order.data[0]["runner_id"]
        ratings = db.table("ratings").select("speed_rating").eq_in_join("orders", "runner_id", runner_id).execute()
        # Simplified: just update with latest
        runner = db.table("users").select("rating,rating_count").eq("id", runner_id).execute()
        if runner.data:
            old_rating = runner.data[0]["rating"]
            old_count = runner.data[0]["rating_count"]
            new_count = old_count + 1
            new_rating = round(((old_rating * old_count) + req.speed_rating) / new_count, 2)
            db.table("users").update({"rating": new_rating, "rating_count": new_count}).eq("id", runner_id).execute()

    return {"message": "Rating submitted! Thank you."}


@router.get("/wallet/balance")
async def wallet_balance(user=Depends(get_current_user)):
    db = get_supabase()
    result = db.table("users").select("wallet_balance").eq("id", user["sub"]).execute()
    return {"balance": result.data[0]["wallet_balance"] if result.data else 0}


@router.post("/wallet/topup")
async def wallet_topup(amount: float, user=Depends(get_current_user)):
    if amount <= 0 or amount > 5000:
        raise HTTPException(400, "Invalid top-up amount (1–5000)")
    db = get_supabase()
    current = db.table("users").select("wallet_balance").eq("id", user["sub"]).execute()
    new_balance = current.data[0]["wallet_balance"] + amount
    db.table("users").update({"wallet_balance": new_balance}).eq("id", user["sub"]).execute()
    db.table("wallet_transactions").insert({
        "user_id": user["sub"],
        "amount": amount,
        "type": "topup",
        "description": "Wallet top-up (UPI/PhonePe simulation)"
    }).execute()
    return {"message": f"₹{amount} added to wallet", "new_balance": new_balance}
