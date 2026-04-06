"""
FastAPI Router: Chat (WebSocket-based messaging)
Message channel is scoped per order_id and auto-disabled after delivery.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from typing import Dict, List
from database import get_supabase

router = APIRouter(prefix="/chat", tags=["chat"])

# In-memory channel store: {order_id: [WebSocket]}
active_connections: Dict[str, List[WebSocket]] = {}


@router.websocket("/ws/{order_id}/{user_id}")
async def chat_websocket(websocket: WebSocket, order_id: str, user_id: str):
    db = get_supabase()

    # Check order is not delivered/cancelled
    order = db.table("orders").select("status,student_id,runner_id").eq("id", order_id).execute()
    if not order.data:
        await websocket.close(code=4004)
        return

    o = order.data[0]
    if o["status"] in ("delivered", "cancelled"):
        await websocket.close(code=4003, reason="Order already completed")
        return

    # Authorize: only student or runner of this order
    if user_id not in (o.get("student_id"), o.get("runner_id")):
        await websocket.close(code=4001, reason="Unauthorized")
        return

    await websocket.accept()
    active_connections.setdefault(order_id, []).append(websocket)

    # Load message history
    history = db.table("messages").select("*").eq("order_id", order_id)\
        .order("created_at").execute().data
    for msg in history:
        await websocket.send_json({"type": "history", "data": msg})

    try:
        while True:
            data = await websocket.receive_text()
            msg_payload = {
                "order_id": order_id,
                "sender_id": user_id,
                "content": data,
            }
            saved = db.table("messages").insert(msg_payload).execute().data[0]

            # Broadcast to all in channel
            dead = []
            for conn in active_connections.get(order_id, []):
                try:
                    await conn.send_json({"type": "message", "data": saved})
                except Exception:
                    dead.append(conn)
            for d in dead:
                active_connections[order_id].remove(d)

    except WebSocketDisconnect:
        conns = active_connections.get(order_id, [])
        if websocket in conns:
            conns.remove(websocket)


@router.get("/history/{order_id}")
async def get_chat_history(order_id: str):
    db = get_supabase()
    result = db.table("messages").select("*").eq("order_id", order_id)\
        .order("created_at").execute()
    return result.data
