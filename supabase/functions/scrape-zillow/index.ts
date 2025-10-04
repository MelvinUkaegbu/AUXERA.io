import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * ============================================================================
 * ZILLOW DATA SCRAPER - Edge Function
 * ============================================================================
 *
 * PURPOSE:
 * This function retrieves property data from Zillow's API to get:
 * - Property square footage
 * - Property cost (estimated value)
 *
 * HOW IT WORKS:
 * 1. Receives property address from frontend
 * 2. Calls Zillow API with the address
 * 3. Parses API response to extract square footage and cost
 * 4. Returns the data back to frontend
 *
 * ZILLOW API SETUP INSTRUCTIONS:
 * ============================================================================
 *
 * STEP 1: Get Zillow API Access
 * -------------------------
 * Option A - Official Zillow API (Recommended but requires approval):
 *   1. Visit: https://www.zillow.com/howto/api/APIOverview.htm
 *   2. Sign up for Zillow API access
 *   3. Wait for approval (can take several days)
 *   4. Get your API key (ZWSID)
 *
 * Option B - Third-Party API Services (Easier, faster setup):
 *   Zillow doesn't provide direct public API access anymore, so use these alternatives:
 *
 *   1. RapidAPI - Zillow API:
 *      - Visit: https://rapidapi.com/apimaker/api/zillow-com1
 *      - Sign up for free account
 *      - Subscribe to the API (free tier available)
 *      - Copy your RapidAPI key from dashboard
 *
 *   2. ScrapeStack or ScraperAPI:
 *      - Visit: https://scrapestack.com/ or https://www.scraperapi.com/
 *      - Sign up and get API key
 *      - Use their service to scrape Zillow pages
 *
 * STEP 2: Store Your API Key
 * -------------------------
 * Add your API key to Supabase environment variables:
 *   1. Go to Supabase Dashboard
 *   2. Select your project
 *   3. Go to Settings > Edge Functions
 *   4. Add environment variable:
 *      Name: ZILLOW_API_KEY
 *      Value: your-api-key-here
 *
 * STEP 3: Implement API Call Below
 * -------------------------
 * Replace the TODO section with actual API call code
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
    // STEP 1: Get the address from the request
    const { address } = await req.json();

    if (!address) {
      return new Response(
        JSON.stringify({ error: "Address is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log(`Fetching Zillow data for address: ${address}`);

    // ========================================================================
    // TODO: IMPLEMENT ZILLOW API CALL HERE
    // ========================================================================
    //
    // STEP 2: Get your API key from environment variables
    // const apiKey = Deno.env.get('ZILLOW_API_KEY');
    //
    // if (!apiKey) {
    //   throw new Error('ZILLOW_API_KEY not configured');
    // }
    //
    // STEP 3: Make API call to Zillow (Example using RapidAPI):
    // -------------------------
    // const response = await fetch(
    //   `https://zillow-com1.p.rapidapi.com/property?address=${encodeURIComponent(address)}`,
    //   {
    //     method: 'GET',
    //     headers: {
    //       'X-RapidAPI-Key': apiKey,
    //       'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com'
    //     }
    //   }
    // );
    //
    // STEP 4: Check if request was successful
    // -------------------------
    // if (!response.ok) {
    //   throw new Error(`Zillow API error: ${response.status}`);
    // }
    //
    // STEP 5: Parse the JSON response
    // -------------------------
    // const zillowData = await response.json();
    //
    // STEP 6: Extract the data you need
    // -------------------------
    // Different APIs have different response structures.
    // You'll need to inspect the API response to know the exact field names.
    //
    // Common field names to look for:
    // - Square footage: livingArea, sqft, squareFeet, livingSpace
    // - Property cost: price, zestimate, value, estimatedValue
    //
    // Example:
    // const square_footage = zillowData.livingArea || zillowData.sqft || null;
    // const property_cost = zillowData.price || zillowData.zestimate || null;
    //
    // STEP 7: Return the extracted data
    // -------------------------
    // const data = {
    //   square_footage: square_footage,
    //   property_cost: property_cost,
    // };
    // ========================================================================

    // TEMPORARY: Mock data response until you implement the API call above
    // DELETE THIS SECTION once you've implemented the real API call
    const data = {
      square_footage: null,
      property_cost: null,
      message: "⚠️ Zillow API not yet configured. Follow the instructions in the code comments to set up Zillow API access.",
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
    console.error("Error in scrape-zillow function:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to fetch Zillow data",
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
