import networkx as nx
import math

# ─────────────────────────────────────────────
# SR University campus graph (OpenStreetMap-based nodes)
# Coordinates: lat/lon of key campus locations
# ─────────────────────────────────────────────

# Key campus nodes with approximate real coordinates (SR University, Warangal)
CAMPUS_NODES = {
    "main_gate":        {"lat": 17.9800, "lon": 79.5300, "label": "Main Gate"},
    "central_canteen":  {"lat": 17.9812, "lon": 79.5315, "label": "Central Canteen"},
    "block_a":          {"lat": 17.9820, "lon": 79.5325, "label": "Block A - Engineering"},
    "block_b":          {"lat": 17.9828, "lon": 79.5310, "label": "Block B - Sciences"},
    "block_c":          {"lat": 17.9835, "lon": 79.5330, "label": "Block C - Management"},
    "library":          {"lat": 17.9818, "lon": 79.5340, "label": "Central Library"},
    "hostel_boys":      {"lat": 17.9805, "lon": 79.5350, "label": "Boys Hostel"},
    "hostel_girls":     {"lat": 17.9795, "lon": 79.5345, "label": "Girls Hostel"},
    "sports_complex":   {"lat": 17.9790, "lon": 79.5320, "label": "Sports Complex"},
    "auditorium":       {"lat": 17.9825, "lon": 79.5295, "label": "Auditorium"},
    "juice_center":     {"lat": 17.9815, "lon": 79.5308, "label": "Juice Center"},
    "lab_block":        {"lat": 17.9832, "lon": 79.5315, "label": "Lab Block"},
    "admin_block":      {"lat": 17.9808, "lon": 79.5300, "label": "Admin Block"},
    "food_court_2":     {"lat": 17.9822, "lon": 79.5320, "label": "Food Court 2"},
}

# Campus edges [node1, node2, distance_meters]
CAMPUS_EDGES = [
    ("main_gate",       "admin_block",    120),
    ("main_gate",       "sports_complex", 180),
    ("admin_block",     "central_canteen", 90),
    ("admin_block",     "auditorium",     100),
    ("central_canteen", "juice_center",    60),
    ("central_canteen", "food_court_2",    80),
    ("juice_center",    "block_a",        130),
    ("juice_center",    "block_b",        110),
    ("food_court_2",    "block_a",        100),
    ("food_court_2",    "lab_block",       90),
    ("block_a",         "block_b",         80),
    ("block_a",         "library",        120),
    ("block_b",         "block_c",         90),
    ("block_b",         "lab_block",       70),
    ("block_c",         "library",         80),
    ("block_c",         "hostel_girls",   150),
    ("library",         "hostel_boys",    130),
    ("library",         "hostel_girls",   110),
    ("hostel_boys",     "sports_complex", 200),
    ("hostel_girls",    "sports_complex", 210),
    ("lab_block",       "auditorium",      80),
    ("auditorium",      "food_court_2",   110),
    ("sports_complex",  "main_gate",      180),
]


def build_campus_graph() -> nx.Graph:
    G = nx.Graph()
    for node_id, data in CAMPUS_NODES.items():
        G.add_node(node_id, **data)
    for u, v, dist in CAMPUS_EDGES:
        G.add_edge(u, v, weight=dist)
    return G


def haversine(lat1, lon1, lat2, lon2) -> float:
    """Straight-line distance in meters between two lat/lon points."""
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
    return 2 * R * math.asin(math.sqrt(a))


def dijkstra_shortest_path(source: str, target: str):
    """Return (path_nodes, total_distance_meters)."""
    G = build_campus_graph()
    try:
        path = nx.dijkstra_path(G, source, target, weight="weight")
        dist = nx.dijkstra_path_length(G, source, target, weight="weight")
        path_coords = [
            {"id": n, "lat": CAMPUS_NODES[n]["lat"], "lon": CAMPUS_NODES[n]["lon"], "label": CAMPUS_NODES[n]["label"]}
            for n in path
        ]
        return {"path": path_coords, "distance_meters": dist, "hops": len(path) - 1}
    except nx.NetworkXNoPath:
        return {"path": [], "distance_meters": -1, "hops": 0}


def calculate_delivery_fee(distance_meters: float, urgent: bool = False) -> float:
    """Fee = base 5₹ + 1₹ per 100m + 10₹ urgent surcharge."""
    base = 5.0
    distance_fee = (distance_meters / 100) * 1.0
    urgent_fee = 10.0 if urgent else 0.0
    return round(base + distance_fee + urgent_fee, 2)


def batch_orders_by_location(orders: list) -> dict:
    """
    Group orders that share the same delivery_location.
    Returns { location_key: [order_ids] }
    """
    batches = {}
    for order in orders:
        loc = order.get("delivery_location", "unknown")
        batches.setdefault(loc, []).append(order["id"])
    return batches


def get_graph_data():
    """Return full graph as JSON for frontend map rendering."""
    nodes = [
        {"id": k, "lat": v["lat"], "lon": v["lon"], "label": v["label"]}
        for k, v in CAMPUS_NODES.items()
    ]
    edges = [
        {"from": u, "to": v, "distance": d,
         "from_lat": CAMPUS_NODES[u]["lat"], "from_lon": CAMPUS_NODES[u]["lon"],
         "to_lat": CAMPUS_NODES[v]["lat"], "to_lon": CAMPUS_NODES[v]["lon"]}
        for u, v, d in CAMPUS_EDGES
    ]
    return {"nodes": nodes, "edges": edges}
