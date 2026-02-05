/*
  # Ticketing & Events Module Schema

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `band_id` (uuid, references bands)
      - `title` (text)
      - `description` (text)
      - `event_date` (timestamptz)
      - `location_name` (text)
      - `address` (text)
      - `latitude` (float8)
      - `longitude` (float8)
      - `ticket_price` (numeric)
      - `currency` (text, default 'usd')
      - `capacity` (int)
      - `tickets_sold` (int, default 0)
      - `status` (text) - draft, published, cancelled, completed
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `event_tickets`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `user_id` (uuid, references auth.users)
      - `qr_hash` (text, unique)
      - `status` (text) - active, used, refunded
      - `purchase_price` (numeric)
      - `stripe_payment_intent_id` (text)
      - `created_at` (timestamptz)
      - `used_at` (timestamptz)

    - `band_payout_settings`
      - `band_id` (uuid, primary key, references bands)
      - `stripe_connect_id` (text)
      - `payout_status` (text) - pending, active
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables.
    - Band owners/admins can manage their own events.
    - Everyone can see published events.
    - Users can see their own tickets.
    - Band owners/admins can see tickets for their events (for scanning).
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id uuid NOT NULL REFERENCES bands(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  location_name text NOT NULL,
  address text,
  latitude float8,
  longitude float8,
  ticket_price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  capacity int,
  tickets_sold int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create event_tickets table
CREATE TABLE IF NOT EXISTS event_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  qr_hash text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active',
  purchase_price numeric NOT NULL,
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now(),
  used_at timestamptz
);

-- Create band_payout_settings table
CREATE TABLE IF NOT EXISTS band_payout_settings (
  band_id uuid PRIMARY KEY REFERENCES bands(id) ON DELETE CASCADE,
  stripe_connect_id text,
  payout_status text NOT NULL DEFAULT 'pending',
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE band_payout_settings ENABLE ROW LEVEL SECURITY;

-- Policies for events
CREATE POLICY "Public can view published events" ON events
  FOR SELECT USING (status = 'published');

CREATE POLICY "Band owners can manage events" ON events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM band_members 
      WHERE band_id = events.band_id 
      AND user_id = auth.uid() 
      AND 'admin' = ANY(roles)
    )
  );

-- Policies for event_tickets
CREATE POLICY "Users can view their own tickets" ON event_tickets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Band admins can view event tickets" ON event_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN band_members bm ON e.band_id = bm.band_id
      WHERE e.id = event_tickets.event_id
      AND bm.user_id = auth.uid()
      AND 'admin' = ANY(bm.roles)
    )
  );

-- Policies for band_payout_settings
CREATE POLICY "Band admins can manage payout settings" ON band_payout_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM band_members 
      WHERE band_id = band_payout_settings.band_id 
      AND user_id = auth.uid() 
      AND 'admin' = ANY(roles)
    )
  );
