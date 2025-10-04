import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * ============================================================================
 * LSU AGCENTER FLOOD DATA SCRAPER - Edge Function
 * ============================================================================
 *
 * PURPOSE:
 * This function retrieves flood zone data from LSU AgCenter to get:
 * - Base Flood Elevation (BFE) - the height floodwater is expected to reach
 * - Flood Zone - the FEMA designation (A, AE, X, etc.)
 *
 * HOW IT WORKS:
 * 1. Receives latitude and longitude coordinates from frontend
 * 2. Queries LSU AgCenter flood map service or FEMA API
 * 3. Extracts base flood elevation and flood zone
 * 4. Returns the data back to frontend
 *
 * LSU AGCENTER DATA SOURCES:
 * ============================================================================
 *
 * UNDERSTANDING FLOOD ZONES:
 * -------------------------
 * - Zone A: High risk flood area, no base flood elevation determined
 * - Zone AE: High risk flood area WITH base flood elevation
 * - Zone AH: Shallow flooding area (1-3 feet deep)
 * - Zone X: Moderate to low risk area
 * - Zone V/VE: Coastal high hazard area with wave action
 *
 * DATA SOURCE OPTIONS:
 * ============================================================================
 *
 * OPTION 1: FEMA Flood Map Service Center API (Recommended - Free & Official)
 * -------------------------
 * FEMA provides the official flood zone data that LSU AgCenter uses.
 *
 * Setup:
 *   1. No API key needed! FEMA data is public
 *   2. API Endpoint: https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer
 *   3. Documentation: https://www.fema.gov/about/openfema/data-sets
 *
 * What you'll query:
 *   - Use "identify" endpoint to get flood zone at specific coordinates
 *   - Returns: flood zone (FLD_ZONE), base flood elevation (STATIC_BFE)
 *
 * Example API Call:
 *   GET https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/identify
 *   Parameters:
 *     - geometry: {"x": longitude, "y": latitude}
 *     - geometryType: esriGeometryPoint
 *     - layers: all:28 (flood zones layer)
 *     - mapExtent: bounding box around the point
 *     - tolerance: 2
 *     - f: json
 *
 * OPTION 2: LSU AgCenter Direct Access
 * -------------------------
 * LSU AgCenter provides Louisiana-specific flood maps:
 *   - Website: https://www.lsuagcenter.com/portals/our_offices/research_stations/floodmaps
 *   - They may have a web service or map interface you can query
 *   - Contact: LSU AgCenter for API access if available
 *   - Note: This is primarily for Louisiana properties
 *
 * OPTION 3: Commercial Flood Data APIs
 * -------------------------
 * If you need more features or easier integration:
 *
 *   1. FloodFactor API (https://floodfactor.com/api)
 *      - Comprehensive flood risk data
 *      - Requires account and API key
 *      - Paid service
 *
 *   2. CoreLogic or First Street Foundation
 *      - Enterprise flood risk APIs
 *      - More expensive but very detailed
 *
 * IMPLEMENTATION STEPS:
 * ============================================================================
 *
 * STEP 1: Choose your data source (FEMA recommended for free access)
 *
 * STEP 2: No API key needed for FEMA (skip if using FEMA)
 *         If using commercial API, store key in Supabase:
 *           - Go to Supabase Dashboard > Settings > Edge Functions
 *           - Add environment variable:
 *             Name: FLOOD_API_KEY
 *             Value: your-api-key-here
 *
 * STEP 3: Implement the API call in the TODO section below
 *
 * ============================================================================
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // STEP 1: Get coordinates from the request
    const { latitude, longitude } = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: "Latitude and longitude are required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log(`Fetching flood data for coordinates: ${latitude}, ${longitude}`);

    // ========================================================================
    // TODO: IMPLEMENT FLOOD DATA API CALL HERE
    // ========================================================================
    //
    // EXAMPLE: Using FEMA Flood Map Service (Free - No API Key Required)
    // -------------------------
    //
    // STEP 2: Build the FEMA API request URL
    // const tolerance = 100; // Search radius in map units
    // const mapExtent = `${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}`;
    //
    // const femaUrl = new URL('https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/identify');
    // femaUrl.searchParams.append('geometry', JSON.stringify({ x: longitude, y: latitude }));
    // femaUrl.searchParams.append('geometryType', 'esriGeometryPoint');
    // femaUrl.searchParams.append('layers', 'all:28'); // Layer 28 is flood zones
    // femaUrl.searchParams.append('mapExtent', mapExtent);
    // femaUrl.searchParams.append('imageDisplay', '400,400,96');
    // femaUrl.searchParams.append('returnGeometry', 'false');
    // femaUrl.searchParams.append('tolerance', tolerance.toString());
    // femaUrl.searchParams.append('f', 'json');
    //
    // STEP 3: Make the API request to FEMA
    // -------------------------
    // const response = await fetch(femaUrl.toString(), {
    //   method: 'GET',
    //   headers: {
    //     'Accept': 'application/json',
    //   }
    // });
    //
    // STEP 4: Check if request was successful
    // -------------------------
    // if (!response.ok) {
    //   throw new Error(`FEMA API error: ${response.status}`);
    // }
    //
    // STEP 5: Parse the JSON response
    // -------------------------
    // const femaData = await response.json();
    //
    // STEP 6: Extract flood zone and base flood elevation
    // -------------------------
    // The FEMA response contains an array of results. We need to find the
    // flood zone layer and extract the relevant fields.
    //
    // Look for these field names in the response:
    // - FLD_ZONE or ZONE_SUBTY: The flood zone designation (A, AE, X, etc.)
    // - STATIC_BFE or BFE_REVERT: Base Flood Elevation in feet
    //
    // let base_flood_elevation = null;
    // let flood_zone = null;
    //
    // if (femaData.results && femaData.results.length > 0) {
    //   const result = femaData.results[0];
    //   const attributes = result.attributes || {};
    //
    //   // Extract flood zone (check multiple possible field names)
    //   flood_zone = attributes.FLD_ZONE || attributes.ZONE_SUBTY || null;
    //
    //   // Extract base flood elevation (check multiple possible field names)
    //   base_flood_elevation = attributes.STATIC_BFE || attributes.BFE_REVERT || null;
    //
    //   // Convert to number if it's a string
    //   if (base_flood_elevation && typeof base_flood_elevation === 'string') {
    //     base_flood_elevation = parseFloat(base_flood_elevation);
    //   }
    // }
    //
    // STEP 7: Return the extracted data
    // -------------------------
    // const data = {
    //   base_flood_elevation: base_flood_elevation,
    //   flood_zone: flood_zone,
    // };
    //
    // ========================================================================
    //
    // ALTERNATIVE: Using a Commercial API (requires API key)
    // -------------------------
    // If using FloodFactor or similar:
    //
    // const apiKey = Deno.env.get('FLOOD_API_KEY');
    //
    // if (!apiKey) {
    //   throw new Error('FLOOD_API_KEY not configured');
    // }
    //
    // const response = await fetch(
    //   `https://api.floodfactor.com/location?lat=${latitude}&lng=${longitude}`,
    //   {
    //     method: 'GET',
    //     headers: {
    //       'Authorization': `Bearer ${apiKey}`,
    //       'Accept': 'application/json',
    //     }
    //   }
    // );
    //
    // const floodData = await response.json();
    //
    // const data = {
    //   base_flood_elevation: floodData.bfe || null,
    //   flood_zone: floodData.zone || null,
    // };
    //
    // ========================================================================

    // TEMPORARY: Mock data response until you implement the API call above
    // DELETE THIS SECTION once you've implemented the real API call
    const data = {
      base_flood_elevation: null,
      flood_zone: null,
      message: "⚠️ Flood data API not yet configured. Follow the instructions in the code comments to set up FEMA or LSU AgCenter data access.",
    };

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in scrape-flood-data function:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to fetch flood data",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
