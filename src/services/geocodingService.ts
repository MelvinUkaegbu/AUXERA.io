/**
 * Geocoding service using OpenStreetMap's Nominatim API
 * Provides address ↔ coordinates conversion
 */

export interface AddressSuggestion {
  display_name: string;
  lat: number;
  lon: number;
}

interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Get address suggestions as user types (for autocomplete)
 * @param address - Partial or full address to search
 * @param limit - Maximum number of suggestions to return (default: 5)
 * @returns Promise with array of address suggestions
 */
export async function getAddressSuggestions(address: string, limit: number = 5): Promise<AddressSuggestion[]> {
  if (!address.trim()) {
    return [];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=${limit}`,
      {
        headers: {
          'User-Agent': 'AuxeraPropertyAnalyzer/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch geocoding data');
    }

    const data: GeocodingResult[] = await response.json();

    return data.map(result => ({
      display_name: result.display_name,
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
    }));
  } catch (error) {
    console.error('Error fetching address suggestions:', error);
    return [];
  }
}

/**
 * Convert address to coordinates (forward geocoding)
 * @param address - Street address to geocode
 * @returns Promise with latitude and longitude
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
  const suggestions = await getAddressSuggestions(address, 1);

  if (suggestions.length === 0) {
    return null;
  }

  return {
    lat: suggestions[0].lat,
    lon: suggestions[0].lon,
  };
}

/**
 * Convert coordinates to address (reverse geocoding)
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Promise with formatted address
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
  // Validate coordinates
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'User-Agent': 'AuxeraPropertyAnalyzer/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch reverse geocoding data');
    }

    const data: GeocodingResult & { error?: string } = await response.json();

    if (data.error) {
      return null;
    }

    return data.display_name || null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}
