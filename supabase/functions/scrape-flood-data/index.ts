import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * Edge Function to scrape flood data from LSU AgCenter flood maps
 *
 * This function acts as a server-side proxy to bypass CORS restrictions
 * and scrape flood zone information and base flood elevation
 *
 * Request body should contain:
 * - latitude: number - Property latitude coordinate
 * - longitude: number - Property longitude coordinate
 *
 * Returns:
 * - base_flood_elevation: number | null
 * - flood_zone: string | null
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

    // TODO: Implement actual LSU AgCenter flood map scraping logic
    // LSU AgCenter URL: https://www.lsuagcenter.com/portals/our_offices/research_stations/floodmaps
    // Consider using their mapping API or web scraping techniques

    console.log(`Scraping flood data for coordinates: ${latitude}, ${longitude}`);

    // Attempt to fetch flood data from LSU AgCenter or FEMA flood maps
    // This is a placeholder - implement actual API call or scraping logic

    const data = {
      base_flood_elevation: null, // Will be populated by actual scraping
      flood_zone: null,           // Will be populated by actual scraping
      message: "LSU AgCenter scraping not yet implemented. Consider using FEMA Flood Map Service API.",
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
        error: "Failed to scrape flood data",
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
