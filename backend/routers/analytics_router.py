"""
FastAPI Router: Analytics (Admin Dashboard)
"""
from fastapi import APIRouter, Depends
from database import get_supabase
from auth import require_role
from graph import get_graph_data

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
async def admin_dashboard(user=Depends(require_role("admin"))):
    db = get_supabase()

    orders = db.table("orders").select("*").execute().data
    total_orders = len(orders)
    delivered = [o for o in orders if o["status"] == "delivered"]
    pending = [o for o in orders if o["status"] in ("pending", "accepted", "preparing", "ready", "picked_up")]
    cancelled = [o for o in orders if o["status"] == "cancelled"]

    total_revenue = sum(o.get("total_amount", 0) for o in delivered)
    avg_delivery_fee = (sum(o.get("delivery_fee", 0) for o in delivered) / len(delivered)) if delivered else 0

    runners = db.table("users").select("id,name,rating,rating_count").eq("role", "runner").execute().data
    students = db.table("users").select("id").eq("role", "student").execute().data

    ratings = db.table("ratings").select("*").execute().data
    avg_food = (sum(r["food_rating"] for r in ratings) / len(ratings)) if ratings else 0
    avg_speed = (sum(r["speed_rating"] for r in ratings) / len(ratings)) if ratings else 0

    # Orders by location
    location_counts = {}
    for o in orders:
        loc = o.get("delivery_location", "unknown")
        location_counts[loc] = location_counts.get(loc, 0) + 1

    # Orders by status
    status_counts = {}
    for o in orders:
        s = o.get("status", "unknown")
        status_counts[s] = status_counts.get(s, 0) + 1

    return {
        "summary": {
            "total_orders": total_orders,
            "delivered": len(delivered),
            "pending": len(pending),
            "cancelled": len(cancelled),
            "total_revenue": round(total_revenue, 2),
            "avg_delivery_fee": round(avg_delivery_fee, 2),
            "total_runners": len(runners),
            "total_students": len(students),
            "avg_food_rating": round(avg_food, 2),
            "avg_speed_rating": round(avg_speed, 2),
        },
        "orders_by_location": location_counts,
        "orders_by_status": status_counts,
        "runners": runners,
        "recent_orders": orders[-10:][::-1],
        "campus_graph": get_graph_data(),
    }


@router.get("/runners")
async def runner_analytics(user=Depends(require_role("admin"))):
    db = get_supabase()
    runners = db.table("users").select("id,name,rating,rating_count,location").eq("role", "runner").execute().data
    for r in runners:
        runner_orders = db.table("orders").select("id,status,total_amount,route_distance")\
            .eq("runner_id", r["id"]).execute().data
        r["total_deliveries"] = sum(1 for o in runner_orders if o["status"] == "delivered")
        r["total_earnings"] = sum(o.get("delivery_fee", 0) for o in runner_orders if o["status"] == "delivered")
        r["total_distance_km"] = round(sum(o.get("route_distance", 0) for o in runner_orders) / 1000, 2)
    return runners


@router.get("/campus-graph")
async def campus_graph(user=Depends(require_role("admin", "runner", "student"))):
    return get_graph_data()
