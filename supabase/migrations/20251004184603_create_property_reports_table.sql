/*
  # Create Property Reports Table

  1. New Tables
    - `property_reports`
      - `id` (uuid, primary key) - Unique identifier for each report
      - `address` (text) - Property street address
      - `latitude` (decimal) - Property latitude coordinate
      - `longitude` (decimal) - Property longitude coordinate
      - `square_footage` (integer) - Property square footage from Zillow
      - `property_cost` (decimal) - Property cost/value from Zillow
      - `base_flood_elevation` (decimal) - Base flood elevation from LSU AgCenter
      - `flood_zone` (text) - Flood zone designation from LSU AgCenter
      - `created_at` (timestamptz) - Timestamp when report was created
      - `updated_at` (timestamptz) - Timestamp when report was last updated

  2. Security
    - Enable RLS on `property_reports` table
    - Add policy for public read access (reports are viewable by anyone)
    - Add policy for public insert access (anyone can create reports)

  3. Notes
    - This table stores elevation project analysis data
    - Data is scraped from Zillow and LSU AgCenter flood maps
    - Public access allows unauthenticated users to generate reports
*/

CREATE TABLE IF NOT EXISTS property_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address text NOT NULL,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  square_footage integer,
  property_cost decimal(12, 2),
  base_flood_elevation decimal(8, 2),
  flood_zone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE property_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view property reports"
  ON property_reports
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create property reports"
  ON property_reports
  FOR INSERT
  TO public
  WITH CHECK (true);
