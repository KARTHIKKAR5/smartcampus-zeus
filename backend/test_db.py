import os
from dotenv import load_dotenv
from supabase import create_client, Client
import traceback

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

try:
    print(f"Connecting to {SUPABASE_URL}...")
    db = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Try querying users
    print("Querying users table...")
    res = db.table("users").select("id").limit(1).execute()
    print("Success! Data:", res.data)
except Exception as e:
    print("ERROR OCCURRED:")
    traceback.print_exc()
