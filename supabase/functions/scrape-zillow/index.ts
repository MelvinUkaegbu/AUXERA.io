import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * ============================================================================
 * ZILLOW DATA SCRAPER - Edge Function (Using RapidAPI)
 * ============================================================================
 *
 * PURPOSE:
 * This function retrieves property data from Zillow via RapidAPI to get:
 * - Property square footage
 * - Property cost (estimated value / Zestimate)
 *
 * HOW IT WORKS:
 * 1. Receives property address from frontend
 * 2. Calls Zillow API via RapidAPI with the address
 * 3. Parses API response to extract square footage and cost
 * 4. Returns the data back to frontend
 *
 * RAPIDAPI SETUP INSTRUCTIONS (STEP-BY-STEP):
 * ============================================================================
 *
 * STEP 1: Sign Up for RapidAPI
 * -------------------------
 * 1. Go to https://rapidapi.com/
 * 2. Click "Sign Up" in the top right corner
 * 3. Create a free account using email or Google/GitHub
 * 4. Verify your email address
 *
 * STEP 2: Subscribe to Zillow API
 * -------------------------
 * 1. Visit: https://rapidapi.com/apimaker/api/zillow-com1
 * 2. You'll see pricing tiers:
 *    - Basic (Free): 100 requests/month
 *    - Pro: More requests per month (paid)
 *    - Ultra/Mega: High volume (paid)
 * 3. Click "Subscribe to Test" or "Pricing" tab
 * 4. Select the "Basic" free plan to start
 * 5. Click "Subscribe" button
 *
 * STEP 3: Get Your RapidAPI Key
 * -------------------------
 * 1. After subscribing, you'll be on the API page
 * 2. Look for the "Code Snippets" section on the right
 * 3. Find the header that says "X-RapidAPI-Key"
 * 4. Copy the long string value (looks like: abc123def456...)
 * 5. This is your RapidAPI key - keep it secure!
 *
 * STEP 4: Add API Key to Supabase
 * -------------------------
 * 1. Go to your Supabase Dashboard: https://supabase.com/dashboard
 * 2. Select your project
 * 3. Click "Edge Functions" in the left sidebar
 * 4. Click "Manage secrets" or "Settings" tab
 * 5. Click "Add new secret"
 * 6. Enter:
 *    Name: RAPIDAPI_KEY
 *    Value: (paste your RapidAPI key here)
 * 7. Click "Save"
 *
 * STEP 5: Deploy This Edge Function
 * -------------------------
 * The function is already written below - just deploy it!
 * It will automatically use the RAPIDAPI_KEY you stored.
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
    // RAPIDAPI IMPLEMENTATION - ZILLOW DATA EXTRACTION
    // ========================================================================

    // STEP 1: Get RapidAPI key from environment variables
    // This key was added in Supabase Dashboard > Edge Functions > Secrets
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');

    // Check if API key is configured
    if (!rapidApiKey) {
      throw new Error('RAPIDAPI_KEY not configured. Please add it in Supabase Dashboard.');
    }

    // STEP 2: Make API call to Zillow via RapidAPI
    // The endpoint searches for property by address
    const response = await fetch(
      `https://zillow-com1.p.rapidapi.com/property?address=${encodeURIComponent(address)}`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com'
        }
      }
    );

    // STEP 3: Check if the API request was successful
    if (!response.ok) {
      throw new Error(`RapidAPI error: ${response.status} - ${response.statusText}`);
    }

    // STEP 4: Parse the JSON response from RapidAPI
    const zillowResponse = await response.json();

    // STEP 5: Extract property data from response
    // ========================================================================
    // IMPORTANT: The response structure may vary depending on the API version
    // Common response structures to check:
    //
    // Structure 1 - Direct property object:
    //   zillowResponse.livingArea (square footage)
    //   zillowResponse.price (current price)
    //   zillowResponse.zestimate (Zillow's estimated value)
    //
    // Structure 2 - Nested in data object:
    //   zillowResponse.data.livingArea
    //   zillowResponse.data.price
    //
    // Structure 3 - Multiple properties in array:
    //   zillowResponse.results[0].livingArea
    //   zillowResponse.results[0].price
    // ========================================================================

    let square_footage = null;
    let property_cost = null;

    // Try to extract from different possible locations in the response
    // This handles various response formats from different RapidAPI Zillow endpoints

    // Try direct access first
    if (zillowResponse.livingArea) {
      square_footage = zillowResponse.livingArea;
    }
    if (zillowResponse.price || zillowResponse.zestimate) {
      property_cost = zillowResponse.price || zillowResponse.zestimate;
    }

    // Try nested in 'data' object
    if (zillowResponse.data) {
      square_footage = square_footage || zillowResponse.data.livingArea || zillowResponse.data.livingAreaValue;
      property_cost = property_cost || zillowResponse.data.price || zillowResponse.data.zestimate;
    }

    // Try if it's in a results array
    if (zillowResponse.results && zillowResponse.results.length > 0) {
      const firstResult = zillowResponse.results[0];
      square_footage = square_footage || firstResult.livingArea || firstResult.livingAreaValue;
      property_cost = property_cost || firstResult.price || firstResult.zestimate;
    }

    // STEP 6: Log the response for debugging (optional, remove in production)
    console.log('RapidAPI Response:', JSON.stringify(zillowResponse, null, 2));
    console.log('Extracted - Square Footage:', square_footage, 'Price:', property_cost);

    // STEP 7: Prepare data to return to frontend
    const data = {
      square_footage: square_footage,
      property_cost: property_cost,
    };

    // ========================================================================
    // END OF RAPIDAPI IMPLEMENTATION
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
