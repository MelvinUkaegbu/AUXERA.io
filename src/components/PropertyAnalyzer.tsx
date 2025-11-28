import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, AlertCircle, Home, DollarSign, Waves, Shield, Crown, Building2 } from 'lucide-react';
import { scrapeZillowData, scrapeFloodData } from '../services/scraperService';
import { getAddressSuggestions, reverseGeocode, AddressSuggestion } from '../services/geocodingService';
import { PropertyReport } from '../types/property';
import StatsCard from './StatsCard';
import PremiumBadge from './PremiumBadge';

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

  // Address autocomplete state
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Typewriter effect state
  const [typewriterText, setTypewriterText] = useState('');
  const fullText = 'Get instant insights on flood risk, property value, and elevation requirements';

  // Debounce timers for geocoding
  const addressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const coordsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  /**
   * Typewriter effect for tagline
   */
  useEffect(() => {
    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypewriterText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 30); // 30ms per character for smooth typing

    return () => clearInterval(intervalId);
  }, []);

  /**
   * Fetch address suggestions as user types
   */
  useEffect(() => {
    // Clear existing timer
    if (addressTimerRef.current) {
      clearTimeout(addressTimerRef.current);
    }

    // Don't fetch suggestions if address is empty
    if (!address.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce suggestion fetching by 500ms
    addressTimerRef.current = setTimeout(async () => {
      const results = await getAddressSuggestions(address, 5);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setSelectedSuggestionIndex(-1);
    }, 500);

    return () => {
      if (addressTimerRef.current) {
        clearTimeout(addressTimerRef.current);
      }
    };
  }, [address]);

  /**
   * Auto-fill address when coordinates change
   */
  useEffect(() => {
    // Clear existing timer
    if (coordsTimerRef.current) {
      clearTimeout(coordsTimerRef.current);
    }

    // Don't reverse geocode if either coordinate is empty
    if (!latitude.trim() || !longitude.trim()) {
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Don't reverse geocode if coordinates are invalid
    if (isNaN(lat) || isNaN(lng)) {
      return;
    }

    // Debounce reverse geocoding by 1 second
    coordsTimerRef.current = setTimeout(async () => {
      const result = await reverseGeocode(lat, lng);
      if (result) {
        setAddress(result);
      }
    }, 1000);

    return () => {
      if (coordsTimerRef.current) {
        clearTimeout(coordsTimerRef.current);
      }
    };
  }, [latitude, longitude]);

  /**
   * Handle suggestion selection from dropdown
   */
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setAddress(suggestion.display_name);
    setLatitude(suggestion.lat.toString());
    setLongitude(suggestion.lon.toString());
    setShowSuggestions(false);
    setSuggestions([]);
  };

  /**
   * Handle keyboard navigation in suggestions dropdown
   */
  const handleAddressKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  /**
   * Close suggestions when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Bar */}
        <nav className="bg-white border-b border-slate-200 rounded-2xl p-4 mb-8 flex items-center justify-between shadow-sm animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-900 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-display font-bold text-primary-900">AUXERA</span>
          </div>
          <button className="bg-primary-900 hover:bg-primary-950 text-white px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2 border border-primary-800">
            <Crown className="w-4 h-4" />
            Upgrade to Premium
          </button>
        </nav>

        {/* Hero Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-primary-950 mb-4">
            Property Elevation Analysis
          </h1>
          <p className="text-slate-600 text-xl max-w-3xl mx-auto h-8 font-medium">
            {typewriterText}
            <span className="animate-pulse">|</span>
          </p>
        </div>

        {/* Input Form Card */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 mb-8 shadow-elegant animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold text-primary-950">
              Property Information
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium">Live Data</span>
            </div>
          </div>

          {/* Address Input */}
          <div className="mb-6">
            <label
              htmlFor="address"
              className="block text-sm font-bold text-primary-900 mb-3 uppercase tracking-wide"
            >
              Property Address
            </label>
            <div className="relative" ref={suggestionsRef}>
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 z-10" />
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={handleAddressKeyDown}
                placeholder="Enter property address..."
                autoComplete="off"
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-300 rounded-lg input-glow outline-none transition-all text-primary-950 placeholder:text-slate-400 font-medium hover:border-primary-900"
              />

              {/* Address Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-300 rounded-lg shadow-elegant max-h-60 overflow-y-auto animate-slide-down">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className={`px-4 py-3 cursor-pointer hover:bg-slate-100 border-b border-slate-200 last:border-b-0 transition-all first:rounded-t-lg last:rounded-b-lg ${
                        index === selectedSuggestionIndex ? 'bg-slate-100' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-slate-600 mt-1 flex-shrink-0" />
                        <span className="text-sm text-primary-950 font-medium">{suggestion.display_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Coordinates Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label
                htmlFor="latitude"
                className="block text-sm font-bold text-primary-900 mb-3 uppercase tracking-wide"
              >
                Latitude
              </label>
              <input
                id="latitude"
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g., 30.4515"
                className="w-full px-4 py-4 bg-white border-2 border-slate-300 rounded-lg input-glow outline-none transition-all text-primary-950 placeholder:text-slate-400 font-medium hover:border-primary-900"
              />
            </div>

            <div>
              <label
                htmlFor="longitude"
                className="block text-sm font-bold text-primary-900 mb-3 uppercase tracking-wide"
              >
                Longitude
              </label>
              <input
                id="longitude"
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g., -91.1871"
                className="w-full px-4 py-4 bg-white border-2 border-slate-300 rounded-lg input-glow outline-none transition-all text-primary-950 placeholder:text-slate-400 font-medium hover:border-primary-900"
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3 animate-slide-down">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-primary-950 hover:bg-primary-900 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 hover:shadow-elegant hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 text-lg border-2 border-primary-900"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent" />
                Analyzing Property...
              </>
            ) : (
              <>
                <Search className="w-6 h-6" />
                Analyze Property
              </>
            )}
          </button>
        </div>

        {/* Report Display */}
        {report && (
          <div className="space-y-8 animate-fade-in">
            {/* Report Header */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 shadow-elegant">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-display font-bold text-primary-950 mb-2">
                    Property Analysis Report
                  </h2>
                  <p className="text-slate-600 font-medium">Complete assessment generated</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold border-2 border-slate-300">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  COMPLETE
                </div>
              </div>

              {/* Address Display */}
              <div className="p-5 bg-slate-50 rounded-xl border-2 border-slate-200">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary-900 mt-1" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Property Address</p>
                    <p className="text-lg font-bold text-primary-950">{report.address}</p>
                    <p className="text-sm text-slate-600 mt-1 font-mono">
                      {report.latitude}, {report.longitude}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Zillow Data Block */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-elegant">
                <h3 className="text-xl font-display font-bold text-primary-950 mb-6 flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary-900" />
                  Zillow Data
                </h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Square Footage</p>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <Home className="w-5 h-5 text-slate-700" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-primary-950">
                          {report.square_footage ? report.square_footage.toLocaleString() : 'N/A'}
                        </p>
                        <p className="text-xs text-slate-600 font-medium">
                          {report.square_footage ? 'sq ft' : 'Not available'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Property Value</p>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <DollarSign className="w-5 h-5 text-primary-900" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-primary-950">
                          {report.property_cost ? `$${(report.property_cost / 1000).toFixed(0)}K` : 'N/A'}
                        </p>
                        <p className="text-xs text-slate-600 font-medium">
                          {report.property_cost ? 'Market estimate' : 'Not available'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* LSU AgCenter Flood Data Block */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-elegant">
                <h3 className="text-xl font-display font-bold text-primary-950 mb-6 flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary-900" />
                  LSU AgCenter Flood Data
                </h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Base Flood Elevation</p>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <Waves className="w-5 h-5 text-slate-700" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-primary-950">
                          {report.base_flood_elevation ? report.base_flood_elevation : 'N/A'}
                        </p>
                        <p className="text-xs text-slate-600 font-medium">
                          {report.base_flood_elevation ? 'ft above sea level' : 'Not available'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Flood Zone</p>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <Shield className="w-5 h-5 text-primary-900" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-primary-950">
                          {report.flood_zone || 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-600 font-medium">FEMA designation</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamp */}
            {report.created_at && (
              <div className="bg-white border-2 border-slate-200 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-600 font-medium">
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
