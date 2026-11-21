import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AdvancedMarker,
  ColorScheme,
  Map as GoogleMap,
  MapMouseEvent,
  Pin,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Crosshair,
  Loader2,
  MapPin,
  Navigation,
  Radio,
  Search,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';

interface LiveLocationPickerProps {
  coordinates: [number, number];
  locationName: string;
  onLocationChange: (
    nextCoordinates: [number, number],
    resolvedAddress?: string,
    wardHint?: string | null
  ) => void;
}

interface ReverseGeocodeResponse {
  formattedAddress?: string;
  shortLabel?: string;
  neighborhood?: string | null;
  wardHint?: string | null;
  placeId?: string | null;
  status?: string;
  error?: string;
}

const MAP_ID = 'triage-live-location-map';

function isQuotaError(err: unknown): boolean {
  if (!err) return false;
  const text =
    typeof err === 'string'
      ? err
      : err instanceof Error
        ? err.message
        : JSON.stringify(err);
  const upper = text.toUpperCase();
  return (
    upper.includes('RESOURCE_EXHAUSTED') ||
    upper.includes('OVER_QUERY_LIMIT') ||
    upper.includes('429') ||
    upper.includes('QUOTA')
  );
}

const MapCameraController: React.FC<{
  coordinates: [number, number];
  zoomRequest: number | null;
}> = ({ coordinates, zoomRequest }) => {
  const map = useMap(MAP_ID);
  const lastCoordsRef = useRef<string>('');

  useEffect(() => {
    if (!map) return;
    const key = `${coordinates[0].toFixed(6)},${coordinates[1].toFixed(6)}`;
    if (lastCoordsRef.current !== key) {
      lastCoordsRef.current = key;
      map.panTo({ lat: coordinates[0], lng: coordinates[1] });
      if (zoomRequest !== null) {
        map.setZoom(zoomRequest);
      }
    }
  }, [map, coordinates, zoomRequest]);

  return null;
};

export const LiveLocationPicker: React.FC<LiveLocationPickerProps> = ({
  coordinates,
  locationName,
  onLocationChange,
}) => {
  const placesLib = useMapsLibrary('places');
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const [isLocating, setIsLocating] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [gpsAccuracyMeters, setGpsAccuracyMeters] = useState<number | null>(null);
  const [locationStatusMsg, setLocationStatusMsg] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [requestedZoom, setRequestedZoom] = useState<number | null>(null);

  // Places API (New) Autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const reverseAbortRef = useRef<AbortController | null>(null);

  // Clean up watchPosition on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (reverseAbortRef.current) {
        reverseAbortRef.current.abort();
      }
    };
  }, []);

  // Reverse geocode via server proxy (/api/geocode/reverse) to avoid CORS trap
  const reverseGeocodeCoords = useCallback(
    async (lat: number, lng: number, zoomLevel: number | null = null) => {
      if (reverseAbortRef.current) {
        reverseAbortRef.current.abort();
      }
      const controller = new AbortController();
      reverseAbortRef.current = controller;

      setIsGeocoding(true);
      try {
        const res = await fetch(
          `/api/geocode/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
          { signal: controller.signal }
        );
        const data = (await res.json()) as ReverseGeocodeResponse;

        if (res.status === 429 || data.status === 'RESOURCE_EXHAUSTED') {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          setLocationError('Maps quota reached while resolving street address. Coordinates saved.');
          onLocationChange([lat, lng]);
          return;
        }

        if (!res.ok) {
          onLocationChange([lat, lng]);
          setLocationStatusMsg(`Pinned coordinates (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
          return;
        }

        const resolvedLabel = data.shortLabel || data.formattedAddress;
        setRequestedZoom(zoomLevel);
        onLocationChange([lat, lng], resolvedLabel, data.wardHint ?? null);
        if (resolvedLabel) {
          setLocationStatusMsg(`Address resolved: ${resolvedLabel}`);
        }
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        onLocationChange([lat, lng]);
      } finally {
        setIsGeocoding(false);
      }
    },
    [onLocationChange]
  );

  // One-shot Live GPS capture triggered by explicit user click
  const handleUseLiveLocation = () => {
    setLocationError(null);
    if (!('geolocation' in navigator)) {
      setLocationError('Browser geolocation is unavailable on this device.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setIsLocating(false);
        setGpsAccuracyMeters(Math.round(accuracy));
        setRequestedZoom(16);
        onLocationChange([latitude, longitude]);
        void reverseGeocodeCoords(latitude, longitude, 16);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError(
            'Location permission denied. Allow location access in your browser or tap the map to pin the area.'
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationError('GPS signal unavailable. Please tap the map or search an area.');
        } else if (err.code === err.TIMEOUT) {
          setLocationError('GPS lock timed out. Try again or place a pin on the map.');
        } else {
          setLocationError('Unable to retrieve live GPS location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  // Explicit, revocable live GPS tracking toggle (watchPosition)
  const handleToggleLiveTracking = () => {
    setLocationError(null);
    if (!('geolocation' in navigator)) {
      setLocationError('Browser geolocation is unavailable on this device.');
      return;
    }

    if (isWatching && watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsWatching(false);
      setLocationStatusMsg('Live GPS tracking paused.');
      return;
    }

    setIsWatching(true);
    setLocationStatusMsg('Live GPS tracking active — updating area pin...');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsAccuracyMeters(Math.round(accuracy));
        setRequestedZoom(16);
        onLocationChange([latitude, longitude]);
        void reverseGeocodeCoords(latitude, longitude, 16);
      },
      (err) => {
        setIsWatching(false);
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? 'Live tracking permission denied by browser.'
            : 'Live GPS tracking interrupted.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 3000,
      }
    );
  };

  // Modern Places API (New) AutocompleteSuggestion fetcher
  useEffect(() => {
    if (!placesLib || !searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new AutocompleteSessionToken();
        }

        setIsSearchingPlaces(true);
        const res = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: searchQuery.trim(),
          sessionToken: sessionTokenRef.current,
          locationBias: {
            center: { lat: coordinates[0], lng: coordinates[1] },
            radius: 25000,
          },
        });
        setSuggestions(res.suggestions || []);
        setShowSuggestions(true);
      } catch (err) {
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        setSuggestions([]);
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 260);

    return () => clearTimeout(timeoutId);
  }, [placesLib, searchQuery, coordinates]);

  const handleSelectSuggestion = async (
    suggestion: google.maps.places.AutocompleteSuggestion
  ) => {
    if (!suggestion.placePrediction) return;
    setLocationError(null);

    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'viewport'],
      });

      const loc = place.location;
      if (loc) {
        const lat = loc.lat();
        const lng = loc.lng();
        const label = (
          place.formattedAddress ||
          place.displayName ||
          suggestion.placePrediction.text.text
        ).slice(0, 180);

        setRequestedZoom(16);
        setGpsAccuracyMeters(null);
        onLocationChange([lat, lng], label);
        setSearchQuery(suggestion.placePrediction.text.text);
        setLocationStatusMsg(`Selected area: ${label}`);
      }

      sessionTokenRef.current = null;
      setSuggestions([]);
      setShowSuggestions(false);
    } catch (err) {
      if (isQuotaError(err)) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        setLocationError('Google Maps Places quota reached.');
      } else {
        setLocationError('Could not load details for the selected place.');
      }
    }
  };

  const handleMapClick = (e: MapMouseEvent) => {
    const latLng = e.detail.latLng;
    if (!latLng) return;
    setLocationError(null);
    setGpsAccuracyMeters(null);
    setRequestedZoom(null);
    onLocationChange([latLng.lat, latLng.lng]);
    void reverseGeocodeCoords(latLng.lat, latLng.lng, null);
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setLocationError(null);
    setGpsAccuracyMeters(null);
    setRequestedZoom(null);
    onLocationChange([lat, lng]);
    void reverseGeocodeCoords(lat, lng, null);
  };

  return (
    <div className="space-y-3 rounded-xl bg-[#0B1020]/90 border border-[#223252] p-3.5">
      {/* Header + Live GPS Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-slate-200 flex items-center gap-1.5 font-bold">
            <Navigation className="w-3.5 h-3.5 text-[#43D9FF]" />
            <span>Incident Area & Live GPS Pin</span>
          </div>
          <p className="text-[11px] text-[#8E9EB8]">
            Share your current GPS area, search a street, or drag the pin onto the hazard.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleUseLiveLocation}
            disabled={isLocating}
            className="px-3 py-1.5 rounded-lg bg-[#C6FF5F]/15 hover:bg-[#C6FF5F]/25 border border-[#C6FF5F]/50 text-[#C6FF5F] text-xs font-mono font-bold flex items-center gap-1.5 transition-all disabled:opacity-60"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Crosshair className="w-3.5 h-3.5" />
            )}
            <span>{isLocating ? 'Acquiring GPS...' : 'Use Live Location'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleLiveTracking}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono flex items-center gap-1.5 border transition-all ${
              isWatching
                ? 'bg-[#43D9FF]/20 border-[#43D9FF] text-[#43D9FF]'
                : 'bg-[#18233B] border-[#2C416A] text-slate-300 hover:text-white'
            }`}
            title="Continuously update your area pin while walking to the hazard"
          >
            <Radio className={`w-3 h-3 ${isWatching ? 'animate-pulse text-[#43D9FF]' : ''}`} />
            <span>{isWatching ? 'Live Follow: ON' : 'Live Follow'}</span>
          </button>
        </div>
      </div>

      {/* Places API (New) Area Search Box */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder={
              mapsApiKey
                ? 'Search neighborhood, road, or landmark via Google Places...'
                : 'Map search unavailable until Google Maps key is loaded'
            }
            disabled={!mapsApiKey}
            className="w-full pl-9 pr-8 py-2 rounded-lg bg-[#121A2B] border border-[#223252] focus:border-[#43D9FF] focus:outline-none text-xs text-slate-100 placeholder-slate-500 disabled:opacity-60"
          />
          {(searchQuery || isSearchingPlaces) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              className="absolute right-2.5 text-slate-400 hover:text-white"
              aria-label="Clear place search"
            >
              {isSearchingPlaces ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#43D9FF]" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-30 left-0 right-0 mt-1 rounded-xl bg-[#121A2B] border border-[#2C416A] shadow-2xl max-h-52 overflow-y-auto divide-y divide-[#223252]">
            {suggestions.map((suggestion, idx) => {
              const text = suggestion.placePrediction?.text.text;
              if (!text) return null;
              return (
                <li key={`${text}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => void handleSelectSuggestion(suggestion)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-[#18233B] hover:text-[#C6FF5F] flex items-center gap-2 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#43D9FF] shrink-0" />
                    <span className="truncate">{text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Interactive Google Map Container (explicit height required by CF2) */}
      <div className="relative h-64 sm:h-72 w-full rounded-xl overflow-hidden border border-[#223252] bg-[#121A2B]">
        {mapsApiKey ? (
          <GoogleMap
            id={MAP_ID}
            mapId="DEMO_MAP_ID"
            colorScheme={ColorScheme.DARK}
            defaultCenter={{ lat: coordinates[0], lng: coordinates[1] }}
            defaultZoom={14}
            gestureHandling="greedy"
            disableDefaultUI={false}
            streetViewControl={false}
            mapTypeControl={false}
            fullscreenControl={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            onClick={handleMapClick}
            className="w-full h-full"
          >
            <MapCameraController coordinates={coordinates} zoomRequest={requestedZoom} />
            <AdvancedMarker
              position={{ lat: coordinates[0], lng: coordinates[1] }}
              draggable={true}
              onDragEnd={handleMarkerDragEnd}
              title={locationName || 'Incident Location Pin (drag to adjust)'}
            >
              <Pin
                background="#C6FF5F"
                borderColor="#0B1020"
                glyphColor="#0B1020"
                scale={1.15}
              />
            </AdvancedMarker>
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center space-y-2">
            <MapPin className="w-7 h-7 text-[#43D9FF]" />
            <div className="text-xs font-mono text-slate-200">
              Google Maps preview activates with VITE_GOOGLE_MAPS_API_KEY
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm">
              You can still capture live GPS coordinates with &ldquo;Use Live Location&rdquo; above and edit your street/landmark below.
            </p>
          </div>
        )}

        {/* Bottom-left coordinate HUD */}
        <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex flex-wrap items-center gap-1.5">
          <span className="px-2 py-1 rounded-md bg-[#0B1020]/90 border border-[#2C416A] text-[10px] font-mono text-[#43D9FF] backdrop-blur-sm">
            {coordinates[0].toFixed(5)}, {coordinates[1].toFixed(5)}
          </span>
          {gpsAccuracyMeters !== null && (
            <span className="px-2 py-1 rounded-md bg-emerald-950/90 border border-emerald-500/40 text-[10px] font-mono text-[#C6FF5F] backdrop-blur-sm">
              GPS ±{gpsAccuracyMeters}m
            </span>
          )}
          {isGeocoding && (
            <span className="px-2 py-1 rounded-md bg-[#0B1020]/90 border border-[#2C416A] text-[10px] font-mono text-slate-200 flex items-center gap-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin text-[#C6FF5F]" />
              <span>Resolving area...</span>
            </span>
          )}
        </div>
      </div>

      {/* Feedback & Consent Row */}
      {locationError && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-950/30 border border-amber-500/40 text-[11px] text-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>{locationError}</span>
        </div>
      )}

      {!locationError && locationStatusMsg && (
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#C6FF5F]">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{locationStatusMsg}</span>
        </div>
      )}

      <p className="text-[10px] text-slate-500 leading-relaxed">
        Location is shared only when you tap &ldquo;Use Live Location&rdquo;, toggle Live Follow, or pin the map, and is stored solely with your submitted civic complaint.
      </p>
    </div>
  );
};
