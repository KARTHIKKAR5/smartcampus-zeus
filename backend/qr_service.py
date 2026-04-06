import qrcode
import base64
from io import BytesIO
import uuid


def generate_qr_for_order(order_id: str) -> str:
    """Generate QR code as base64 PNG string."""
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    payload = f"TLML-ORDER-{order_id}"
    qr.add_data(payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    encoded = base64.b64encode(buf.read()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


def verify_qr_payload(payload: str, order_id: str) -> bool:
    """Verify that scanned QR matches order_id."""
    expected = f"TLML-ORDER-{order_id}"
    return payload.strip() == expected
