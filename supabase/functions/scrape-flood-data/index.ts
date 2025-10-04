import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * ============================================================================
 * LSU AGCENTER FLOOD DATA SCRAPER - Edge Function (Using RapidAPI)
 * ============================================================================
 *
 * PURPOSE:
 * This function retrieves flood zone data for Louisiana properties to get:
 * - Base Flood Elevation (BFE) - the height floodwater is expected to reach
 * - Flood Zone - the FEMA designation (A, AE, X, etc.)
 *
 * HOW IT WORKS:
 * 1. Receives latitude and longitude coordinates from frontend
 * 2. Queries flood data API via RapidAPI
 * 3. Extracts base flood elevation and flood zone
 * 4. Returns the data back to frontend
 *
 * UNDERSTANDING FLOOD ZONES:
 * ============================================================================
 * - Zone A: High risk flood area, no base flood elevation determined
 * - Zone AE: High risk flood area WITH base flood elevation
 * - Zone AH: Shallow flooding area (1-3 feet deep)
 * - Zone X (or B/C): Moderate to low risk area
 * - Zone V/VE: Coastal high hazard area with wave action
 *
 * RAPIDAPI SETUP INSTRUCTIONS (STEP-BY-STEP):
 * ============================================================================
 *
 * OPTION 1: FEMA Flood Map Data API on RapidAPI (Recommended)
 * -------------------------
 *
 * STEP 1: Sign Up for RapidAPI (if not already done)
 * 1. Go to https://rapidapi.com/
 * 2. Click "Sign Up" and create free account
 * 3. Verify your email address
 *
 * STEP 2: Find a Flood Data API on RapidAPI
 * 1. Search for "FEMA flood" or "flood zone" APIs on RapidAPI
 * 2. Recommended APIs:
 *    - "FEMA Flood Map" API
 *    - "Natural Hazards - FEMA" API
 *    - Or search for "Louisiana flood map" for state-specific data
 *
 * Example API to try:
 * - Visit: https://rapidapi.com/search/fema
 * - Look for APIs that provide flood zone data by coordinates
 *
 * STEP 3: Subscribe to the Flood API
 * 1. Select an API from search results
 * 2. Click "Pricing" tab
 * 3. Subscribe to free tier (usually 100-500 requests/month)
 * 4. Click "Subscribe" button
 *
 * STEP 4: Get Your RapidAPI Key
 * 1. After subscribing, go to the API page
 * 2. Look for "Code Snippets" section
 * 3. Find "X-RapidAPI-Key" header
 * 4. Copy the key value (if you already did this for Zillow, use same key!)
 *
 * STEP 5: Add API Key to Supabase (if not already done)
 * 1. Go to Supabase Dashboard: https://supabase.com/dashboard
 * 2. Select your project
 * 3. Click "Edge Functions" > "Manage secrets"
 * 4. If RAPIDAPI_KEY doesn't exist, add it:
 *    Name: RAPIDAPI_KEY
 *    Value: (paste your RapidAPI key)
 * 5. If it already exists from Zillow setup, you can use the same key!
 *
 * STEP 6: Update the API Endpoint Below
 * 1. Find the exact endpoint URL from your chosen RapidAPI flood API
 * 2. Replace the placeholder URL in the code below with actual endpoint
 * 3. Update the response parsing logic based on the API's response format
 *
 * ============================================================================
 *
 * OPTION 2: Direct FEMA API (Free, No RapidAPI needed, but more complex)
 * -------------------------
 * If you prefer not to use RapidAPI, you can query FEMA directly:
 * - Endpoint: https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer
 * - Documentation: https://www.fema.gov/about/openfema/api-documentation
 * - No API key required
 * - More complex to implement
 * - See commented code section below for implementation example
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
    // RAPIDAPI IMPLEMENTATION - FLOOD DATA EXTRACTION
    // ========================================================================

    // STEP 1: Get RapidAPI key from environment variables
    // This is the SAME key used for Zillow - one key works for all RapidAPI services!
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');

    // Check if API key is configured
    if (!rapidApiKey) {
      throw new Error('RAPIDAPI_KEY not configured. Please add it in Supabase Dashboard.');
    }

    // ========================================================================
    // STEP 2: Choose Your Implementation Method
    // ========================================================================
    // You have two options:
    //
    // METHOD A: Use RapidAPI Flood Data Service (Easier but requires finding the right API)
    // METHOD B: Use Direct FEMA API (Free, no extra signup, but slightly more complex)
    //
    // Below is METHOD B (Direct FEMA) which is READY TO USE NOW
    // To use METHOD A, follow these steps:
    //   1. Find a flood data API on RapidAPI (search "FEMA flood" or "flood zone")
    //   2. Subscribe to the API
    //   3. Replace the fetch URL below with the RapidAPI endpoint
    //   4. Add 'X-RapidAPI-Key' and 'X-RapidAPI-Host' headers
    //   5. Update the response parsing logic
    // ========================================================================

    // METHOD B: Direct FEMA API Implementation (NO ADDITIONAL SETUP NEEDED)
    // -------------------------
    // Build the FEMA API request URL
    const tolerance = 100; // Search radius in map units
    const mapExtent = `${longitude - 0.01},${latitude - 0.01},${longitude + 0.01},${latitude + 0.01}`;

    const femaUrl = new URL('https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/identify');
    femaUrl.searchParams.append('geometry', JSON.stringify({ x: longitude, y: latitude }));
    femaUrl.searchParams.append('geometryType', 'esriGeometryPoint');
    femaUrl.searchParams.append('layers', 'all:28'); // Layer 28 is flood zones
    femaUrl.searchParams.append('mapExtent', mapExtent);
    femaUrl.searchParams.append('imageDisplay', '400,400,96');
    femaUrl.searchParams.append('returnGeometry', 'false');
    femaUrl.searchParams.append('tolerance', tolerance.toString());
    femaUrl.searchParams.append('f', 'json');

    // STEP 3: Make the API request to FEMA
    const response = await fetch(femaUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    // STEP 4: Check if request was successful
    if (!response.ok) {
      throw new Error(`FEMA API error: ${response.status} - ${response.statusText}`);
    }

    // STEP 5: Parse the JSON response
    const femaData = await response.json();

    // STEP 6: Extract flood zone and base flood elevation from FEMA response
    // ========================================================================
    // FEMA returns results in this structure:
    // {
    //   results: [
    //     {
    //       layerId: 28,
    //       layerName: "Flood Hazard Zones",
    //       attributes: {
    //         FLD_ZONE: "AE",           // Flood zone designation
    //         ZONE_SUBTY: "AE",         // Alternative zone field
    //         STATIC_BFE: 15.5,         // Base Flood Elevation in feet
    //         BFE_REVERT: 15.5,         // Alternative BFE field
    //         SFHA_TF: "T",             // Special Flood Hazard Area (T/F)
    //         ... other fields
    //       }
    //     }
    //   ]
    // }
    // ========================================================================

    let base_flood_elevation = null;
    let flood_zone = null;

    // Check if we have results from FEMA
    if (femaData.results && femaData.results.length > 0) {
      // Loop through results to find flood zone data (usually in layer 28)
      for (const result of femaData.results) {
        const attributes = result.attributes || {};

        // Extract flood zone (try multiple possible field names)
        if (!flood_zone) {
          flood_zone = attributes.FLD_ZONE ||
                      attributes.ZONE_SUBTY ||
                      attributes.ZONE_LBL ||
                      null;
        }

        // Extract base flood elevation (try multiple possible field names)
        if (!base_flood_elevation) {
          base_flood_elevation = attributes.STATIC_BFE ||
                                attributes.BFE_REVERT ||
                                attributes.DEPTH ||
                                null;

          // Convert to number if it's a string
          if (base_flood_elevation && typeof base_flood_elevation === 'string') {
            base_flood_elevation = parseFloat(base_flood_elevation);
          }

          // Skip if value is invalid
          if (base_flood_elevation === 0 || isNaN(base_flood_elevation)) {
            base_flood_elevation = null;
          }
        }

        // If we found both values, we can stop searching
        if (flood_zone && base_flood_elevation) {
          break;
        }
      }
    }

    // STEP 7: Log the response for debugging (optional, remove in production)
    console.log('FEMA API Response:', JSON.stringify(femaData, null, 2));
    console.log('Extracted - Flood Zone:', flood_zone, 'BFE:', base_flood_elevation);

    // STEP 8: Prepare data to return to frontend
    const data = {
      base_flood_elevation: base_flood_elevation,
      flood_zone: flood_zone,
    };

    // ========================================================================
    // END OF FLOOD DATA IMPLEMENTATION
    // ========================================================================
    //
    // ALTERNATIVE: If you want to use RapidAPI flood service instead:
    // ========================================================================
    // Replace the FEMA code above with:
    //
    // const response = await fetch(
    //   `https://YOUR-RAPIDAPI-FLOOD-API.p.rapidapi.com/endpoint?lat=${latitude}&lng=${longitude}`,
    //   {
    //     method: 'GET',
    //     headers: {
    //       'X-RapidAPI-Key': rapidApiKey,
    //       'X-RapidAPI-Host': 'YOUR-RAPIDAPI-FLOOD-API.p.rapidapi.com'
    //     }
    //   }
    // );
    //
    // const floodResponse = await response.json();
    //
    // // Extract based on your specific API's response format
    // const data = {
    //   base_flood_elevation: floodResponse.bfe || floodResponse.elevation || null,
    //   flood_zone: floodResponse.zone || floodResponse.fld_zone || null,
    // };
    // ========================================================================

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
