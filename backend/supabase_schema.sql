-- ============================================================
-- The Last Meal Mile — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- USERS TABLE (students, runners, admins, canteen owners)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('student','runner','admin','canteen_owner')),
  phone           TEXT DEFAULT '',
  location        TEXT DEFAULT '',       -- campus node id
  wallet_balance  FLOAT DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  rating          FLOAT DEFAULT 0,
  rating_count    INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- CANTEENS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS canteens (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT NOT NULL,
  location    TEXT NOT NULL,           -- campus node id
  owner_id    UUID REFERENCES users(id),
  image_url   TEXT DEFAULT '',
  is_open     BOOLEAN DEFAULT TRUE,
  description TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- MENU ITEMS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  canteen_id        UUID REFERENCES canteens(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT DEFAULT '',
  price             FLOAT NOT NULL,
  category          TEXT DEFAULT 'Main',
  is_available      BOOLEAN DEFAULT TRUE,
  image_url         TEXT DEFAULT '',
  prep_time_minutes INT DEFAULT 10,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- ORDERS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id        UUID REFERENCES users(id),
  runner_id         UUID REFERENCES users(id),
  canteen_id        UUID REFERENCES canteens(id),
  canteen_location  TEXT NOT NULL,
  delivery_location TEXT NOT NULL,
  items             JSONB NOT NULL,
  total_item_cost   FLOAT NOT NULL,
  delivery_fee      FLOAT NOT NULL DEFAULT 0,
  total_amount      FLOAT NOT NULL,
  urgent            BOOLEAN DEFAULT FALSE,
  route_path        JSONB DEFAULT '[]',
  route_distance    FLOAT DEFAULT 0,
  qr_code           TEXT DEFAULT '',
  qr_verified       BOOLEAN DEFAULT FALSE,
  status            TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending','accepted','preparing','ready','picked_up','delivered','cancelled')),
  payment_status    TEXT DEFAULT 'paid',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at();

-- ─────────────────────────────────────────────────────────────
-- RATINGS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ratings (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id     UUID REFERENCES orders(id),
  student_id   UUID REFERENCES users(id),
  food_rating  FLOAT CHECK (food_rating BETWEEN 1 AND 5),
  speed_rating FLOAT CHECK (speed_rating BETWEEN 1 AND 5),
  comment      TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- MESSAGES TABLE (Chat)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id   UUID REFERENCES orders(id),
  sender_id  UUID REFERENCES users(id),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- WALLET TRANSACTIONS TABLE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES users(id),
  amount      FLOAT NOT NULL,
  type        TEXT CHECK (type IN ('topup','deduction','refund')),
  description TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- SEED DATA: Canteens
-- ─────────────────────────────────────────────────────────────
INSERT INTO canteens (name, location, description) VALUES
  ('Central Canteen', 'central_canteen', 'Main campus canteen with diverse cuisines including salads, soups, sweets and Chinese dishes.'),
  ('SR Juice Center', 'juice_center', 'Fresh juices, smoothies and snacks. Newly opened!'),
  ('Food Court 2', 'food_court_2', 'Quick bites, full meals and variety options near the lab block.')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- SEED DATA: Menu Items (Central Canteen)
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE v_canteen_id UUID;
BEGIN
  SELECT id INTO v_canteen_id FROM canteens WHERE name = 'Central Canteen' LIMIT 1;
  INSERT INTO menu_items (canteen_id, name, description, price, category, prep_time_minutes) VALUES
    (v_canteen_id, 'Veg Thali', 'Rice, dal, 2 sabzi, roti, salad', 60, 'Meals', 15),
    (v_canteen_id, 'Chicken Biryani', 'Aromatic basmati rice with spiced chicken', 90, 'Meals', 20),
    (v_canteen_id, 'Veg Fried Rice', 'Wok-tossed rice with vegetables', 50, 'Chinese', 10),
    (v_canteen_id, 'Paneer Butter Masala', 'Creamy tomato-based paneer curry', 75, 'Main', 15),
    (v_canteen_id, 'Noodles', 'Hakka noodles with vegetables', 45, 'Chinese', 8),
    (v_canteen_id, 'Sambar Rice', 'South Indian style with papad', 40, 'Meals', 10),
    (v_canteen_id, 'Gulab Jamun (2pc)', 'Soft sweet dessert', 20, 'Sweets', 2),
    (v_canteen_id, 'Garden Salad', 'Fresh seasonal vegetables with lemon dressing', 30, 'Salads', 5),
    (v_canteen_id, 'Tomato Soup', 'Creamy homemade tomato soup', 35, 'Soups', 8),
    (v_canteen_id, 'Masala Dosa', 'Crispy dosa with potato filling and chutneys', 40, 'Breakfast', 12)
  ON CONFLICT DO NOTHING;
END $$;

-- Juice Center items
DO $$
DECLARE v_canteen_id UUID;
BEGIN
  SELECT id INTO v_canteen_id FROM canteens WHERE name = 'SR Juice Center' LIMIT 1;
  INSERT INTO menu_items (canteen_id, name, description, price, category, prep_time_minutes) VALUES
    (v_canteen_id, 'Fresh Orange Juice', '100% fresh squeezed oranges', 30, 'Juices', 3),
    (v_canteen_id, 'Mango Lassi', 'Thick yogurt mango blend', 35, 'Juices', 3),
    (v_canteen_id, 'Watermelon Juice', 'Refreshing cold watermelon', 25, 'Juices', 3),
    (v_canteen_id, 'Mixed Fruit Smoothie', 'Blend of seasonal fruits', 45, 'Smoothies', 5),
    (v_canteen_id, 'Sugarcane Juice', 'Fresh sugarcane with ginger and lemon', 20, 'Juices', 3),
    (v_canteen_id, 'Masala Lemonade', 'Spiced lemon cooler', 20, 'Drinks', 2)
  ON CONFLICT DO NOTHING;
END $$;

-- Seed an admin user (password: Admin@123)
INSERT INTO users (email, password_hash, name, role, wallet_balance) VALUES
  ('admin@sruniversity.edu',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGniMKitLrLJST3.DzfJmMkWCFq',
   'SR Admin', 'admin', 0)
ON CONFLICT DO NOTHING;
