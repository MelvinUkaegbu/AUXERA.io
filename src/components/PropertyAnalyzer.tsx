import { useState } from 'react';
import { Search, MapPin, AlertCircle } from 'lucide-react';
import { scrapeZillowData, scrapeFloodData } from '../services/scraperService';
import { PropertyReport } from '../types/property';

/**
 * PropertyAnalyzer Component
 *
 * Main component for analyzing properties for elevation projects
 * Allows users to input address and coordinates, then scrapes data from:
 * - Zillow: Property square footage and cost
 * - LSU AgCenter: Base flood elevation and flood zone
 */
export default function PropertyAnalyzer() {
  // Form input state
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<PropertyReport | null>(null);

  /**
   * Handles form submission and initiates data scraping
   * 1. Validates input fields
   * 2. Scrapes data from Zillow and LSU AgCenter
   * 3. Saves report to database
   * 4. Displays results to user
   */
  const handleAnalyze = async () => {
    // Reset error and report state
    setError(null);
    setReport(null);

    // Validate required fields
    if (!address.trim()) {
      setError('Please enter a property address');
      return;
    }

    if (!latitude.trim() || !longitude.trim()) {
      setError('Please enter latitude and longitude coordinates');
      return;
    }

    // Validate coordinate format
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      setError('Please enter valid numeric coordinates');
      return;
    }

    if (lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      setError('Longitude must be between -180 and 180');
      return;
    }

    setLoading(true);

    try {
      // Scrape data from both sources in parallel
      const [zillowData, floodData] = await Promise.all([
        scrapeZillowData(address),
        scrapeFloodData(lat, lng),
      ]);

      // Create property report object
      const propertyReport: PropertyReport = {
        address,
        latitude: lat,
        longitude: lng,
        square_footage: zillowData.square_footage,
        property_cost: zillowData.property_cost,
        base_flood_elevation: floodData.base_flood_elevation,
        flood_zone: floodData.flood_zone,
        created_at: new Date().toISOString(),
      };

      // Update UI with report data (no database save for now)
      setReport(propertyReport);
    } catch (err) {
      console.error('Error analyzing property:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to analyze property'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-3">
            Property Elevation Analyzer
          </h1>
          <p className="text-slate-600 text-lg">
            Analyze properties for elevation projects with data from Zillow and LSU AgCenter flood maps
          </p>
        </div>

        {/* Input Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">
            Property Information
          </h2>

          {/* Address Input */}
          <div className="mb-6">
            <label
              htmlFor="address"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Property Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter street address"
                className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          {/* Coordinates Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label
                htmlFor="latitude"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Latitude
              </label>
              <input
                id="latitude"
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g., 30.4515"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="longitude"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Longitude
              </label>
              <input
                id="longitude"
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g., -91.1871"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Analyzing Property...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Analyze Property
              </>
            )}
          </button>
        </div>

        {/* Report Display */}
        {report && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-slate-800 mb-6">
              Property Analysis Report
            </h2>

            {/* Address Display */}
            <div className="mb-8 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Address</p>
              <p className="text-lg font-medium text-slate-800">{report.address}</p>
              <p className="text-sm text-slate-500 mt-1">
                Coordinates: {report.latitude}, {report.longitude}
              </p>
            </div>

            {/* Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Zillow Data Section */}
              <div className="border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  Zillow Data
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Square Footage</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {report.square_footage
                        ? `${report.square_footage.toLocaleString()} sq ft`
                        : 'Not available'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-600 mb-1">Property Cost</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {report.property_cost
                        ? `$${report.property_cost.toLocaleString()}`
                        : 'Not available'}
                    </p>
                  </div>
                </div>
              </div>

              {/* LSU AgCenter Flood Data Section */}
              <div className="border border-slate-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                  LSU AgCenter Flood Data
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Base Flood Elevation</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {report.base_flood_elevation
                        ? `${report.base_flood_elevation} ft`
                        : 'Not available'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-600 mb-1">Flood Zone</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {report.flood_zone || 'Not available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamp */}
            {report.created_at && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-sm text-slate-500">
                  Report generated on {new Date(report.created_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
