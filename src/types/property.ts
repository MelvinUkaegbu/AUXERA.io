/**
 * Interface for property report data structure
 * Contains all scraped and user-input data for elevation analysis
 */
export interface PropertyReport {
  id?: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  square_footage: number | null;
  property_cost: number | null;
  base_flood_elevation: number | null;
  flood_zone: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface for Zillow scraped data
 */
export interface ZillowData {
  square_footage: number | null;
  property_cost: number | null;
}

/**
 * Interface for LSU AgCenter flood map data
 */
export interface FloodData {
  base_flood_elevation: number | null;
  flood_zone: string | null;
}
