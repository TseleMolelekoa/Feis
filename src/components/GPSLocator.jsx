// src/components/GPSLocator.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';

export default function GPSLocator({ onLocationSelect, onClose }) {
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [watchId, setWatchId] = useState(null);
    const [manualLat, setManualLat] = useState("");
    const [manualLng, setManualLng] = useState("");
    const [locationHistory, setLocationHistory] = useState([]);
    const [bestAccuracy, setBestAccuracy] = useState(null);
    const [isWatching, setIsWatching] = useState(false);
    const mountedRef = useRef(true);
    const watchIdRef = useRef(null);

    const updateMapUrl = useCallback((lat, lng) => {
        // Using OpenStreetMap static maps (free, no API key required)
        return `https://tile.openstreetmap.org/18/${Math.floor((lng + 180) / 360 * Math.pow(2, 18))}/${Math.floor((90 - lat) / 180 * Math.pow(2, 18))}.png`;
    }, []);

    // Alternative: Use a proper static map service
    const getStaticMapUrl = useCallback((lat, lng) => {
        // Using MapTiler free static maps (requires key but more reliable)
        // For production, consider using your own API key or service
        const zoom = 17;
        const size = "400x300";
        return `https://api.maptiler.com/maps/streets/static/${lng},${lat},${zoom}/${size}.png?key=YOUR_API_KEY`;
    }, []);

    // Improved location watching with better accuracy filtering
    const startWatching = useCallback((initialPosition) => {
        if (!navigator.geolocation) return;

        // Clear existing watch
        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }

        const watch = navigator.geolocation.watchPosition(
            (newPosition) => {
                if (!mountedRef.current) return;

                const newLoc = {
                    lat: newPosition.coords.latitude,
                    lng: newPosition.coords.longitude,
                    accuracy: newPosition.coords.accuracy,
                    altitude: newPosition.coords.altitude,
                    altitudeAccuracy: newPosition.coords.altitudeAccuracy,
                    heading: newPosition.coords.heading,
                    speed: newPosition.coords.speed,
                    timestamp: newPosition.timestamp,
                    manual: false
                };

                // Update location history
                setLocationHistory(prev => {
                    const updated = [...prev, newLoc];
                    // Keep last 10 locations
                    return updated.slice(-10);
                });

                // Update best accuracy
                setBestAccuracy(prev => {
                    if (!prev || newLoc.accuracy < prev.accuracy) {
                        return newLoc;
                    }
                    return prev;
                });

                // Update location if this is the first reading or better accuracy
                setLocation(prev => {
                    if (!prev || newLoc.accuracy < prev.accuracy) {
                        return newLoc;
                    }
                    return prev;
                });

                setLoading(false);
                setIsWatching(true);
            },
            (err) => {
                console.error("Watch error:", err);
                if (mountedRef.current) {
                    setError(`Location tracking error: ${getErrorMessage(err)}`);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000 // Accept positions up to 5 seconds old
            }
        );

        watchIdRef.current = watch;
        setWatchId(watch);
    }, []);

    const getErrorMessage = (err) => {
        switch(err.code) {
            case err.PERMISSION_DENIED:
                return "Location permission denied. Please enable location access.";
            case err.POSITION_UNAVAILABLE:
                return "Location information is unavailable. Please check your GPS signal.";
            case err.TIMEOUT:
                return "Location request timed out. Please try again or check your GPS signal.";
            default:
                return "An error occurred while getting location.";
        }
    };

    const getCurrentLocation = useCallback(() => {
        setLoading(true);
        setError("");
        setLocationHistory([]);
        setBestAccuracy(null);

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setLoading(false);
            return;
        }

        // First get a quick location
        navigator.geolocation.getCurrentPosition(
            (position) => {
                if (!mountedRef.current) return;

                const initialLoc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                    timestamp: position.timestamp,
                    manual: false
                };

                setLocation(initialLoc);
                setLoading(false);
                
                // Start watching for better accuracy
                startWatching(initialLoc);
            },
            (err) => {
                if (mountedRef.current) {
                    setError(getErrorMessage(err));
                    setLoading(false);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    }, [startWatching]);

    // Clean up on unmount
    useEffect(() => {
        mountedRef.current = true;
        getCurrentLocation();

        return () => {
            mountedRef.current = false;
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [getCurrentLocation]);

    const handleManualSubmit = () => {
        const lat = parseFloat(manualLat);
        const lng = parseFloat(manualLng);
        
        if (isNaN(lat) || isNaN(lng)) {
            setError("Please enter valid coordinates (numbers only)");
            return;
        }
        
        if (lat < -90 || lat > 90) {
            setError("Latitude must be between -90 and 90");
            return;
        }
        
        if (lng < -180 || lng > 180) {
            setError("Longitude must be between -180 and 180");
            return;
        }

        const loc = {
            lat,
            lng,
            accuracy: 0,
            manual: true,
            timestamp: Date.now()
        };
        
        setLocation(loc);
        setError("");
        
        // Stop watching since we're using manual coordinates
        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
            setIsWatching(false);
        }
    };

    const confirmLocation = () => {
        if (location) {
            const locationString = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
            const locationData = {
                coordinates: locationString,
                lat: location.lat,
                lng: location.lng,
                accuracy: location.accuracy,
                manual: location.manual || false,
                timestamp: location.timestamp,
                altitude: location.altitude,
                heading: location.heading,
                speed: location.speed
            };
            onLocationSelect(locationData);
            onClose(); // Auto-close after selection
        }
    };

    const formatCoordinates = (lat, lng) => {
        const latDir = lat >= 0 ? 'N' : 'S';
        const lngDir = lng >= 0 ? 'E' : 'W';
        const latAbs = Math.abs(lat);
        const lngAbs = Math.abs(lng);

        const latDeg = Math.floor(latAbs);
        const latMin = Math.floor((latAbs - latDeg) * 60);
        const latSec = ((latAbs - latDeg) * 60 - latMin) * 60;

        const lngDeg = Math.floor(lngAbs);
        const lngMin = Math.floor((lngAbs - lngDeg) * 60);
        const lngSec = ((lngAbs - lngDeg) * 60 - lngMin) * 60;

        return `${latDeg}°${latMin.toFixed(0)}'${latSec.toFixed(1)}"${latDir} ${lngDeg}°${lngMin.toFixed(0)}'${lngSec.toFixed(1)}"${lngDir}`;
    };

    const getLocationQuality = (accuracy) => {
        if (accuracy <= 5) return { text: "Excellent", color: "green" };
        if (accuracy <= 10) return { text: "Good", color: "blue" };
        if (accuracy <= 20) return { text: "Fair", color: "yellow" };
        if (accuracy <= 50) return { text: "Poor", color: "orange" };
        return { text: "Very Poor", color: "red" };
    };

    return (
        <div
            style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.95)" }}
            className="flex items-center justify-center p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 flex items-center justify-between">
                    <div>
                        <p className="text-white font-semibold text-sm">📍 GPS Location</p>
                        <p className="text-red-200 text-xs">Get current position or enter coordinates</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white text-3xl w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-500 transition-colors leading-none"
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {loading && (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-600 border-t-transparent"></div>
                            <p className="text-sm text-gray-600 mt-2">Getting your location...</p>
                            <p className="text-xs text-gray-400 mt-1">Please ensure GPS is enabled</p>
                            <p className="text-xs text-gray-400">This may take a few seconds</p>
                        </div>
                    )}

                    {isWatching && !loading && location && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2">
                            <p className="text-xs text-blue-700 flex items-center gap-1">
                                <span className="animate-pulse">📍</span> 
                                Tracking location updates...
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
                            <div className="flex items-start gap-2">
                                <span className="text-lg">⚠️</span>
                                <div className="flex-1">
                                    <p className="font-semibold">Location Error</p>
                                    <p className="text-xs mt-1">{error}</p>
                                    <button
                                        onClick={getCurrentLocation}
                                        className="mt-2 text-red-600 font-semibold text-xs hover:text-red-700"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {location && !loading && (
                        <>
                            <div className={`rounded-xl p-3 ${
                                location.manual 
                                    ? "bg-blue-50 border border-blue-200" 
                                    : "bg-green-50 border border-green-200"
                            }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">📍</span>
                                    <div className="flex-1">
                                        <span className="text-sm font-semibold">
                                            {location.manual ? "Manual Location" : "GPS Location"}
                                        </span>
                                        {!location.manual && location.accuracy > 0 && (
                                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full bg-${
                                                getLocationQuality(location.accuracy).color
                                            }-100 text-${
                                                getLocationQuality(location.accuracy).color
                                            }-700`}>
                                                {getLocationQuality(location.accuracy).text} Accuracy
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <p className="text-xs text-gray-700 font-mono mb-1 break-all">
                                    {location.lat.toFixed(6)}°, {location.lng.toFixed(6)}°
                                </p>
                                <p className="text-xs text-gray-500">
                                    {formatCoordinates(location.lat, location.lng)}
                                </p>
                                
                                {!location.manual && location.accuracy > 0 && (
                                    <>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Accuracy: ±{Math.round(location.accuracy)} meters
                                        </p>
                                        {location.altitude && (
                                            <p className="text-xs text-gray-500">
                                                Altitude: {Math.round(location.altitude)}m 
                                                {location.altitudeAccuracy && ` ±${Math.round(location.altitudeAccuracy)}m`}
                                            </p>
                                        )}
                                        {location.speed > 0 && (
                                            <p className="text-xs text-gray-500">
                                                Speed: {Math.round(location.speed * 3.6)} km/h
                                            </p>
                                        )}
                                    </>
                                )}
                                
                                {location.manual && (
                                    <p className="text-xs text-blue-600 mt-1">
                                        ℹ️ Manually entered coordinates
                                    </p>
                                )}

                                {bestAccuracy && !location.manual && bestAccuracy.accuracy < location.accuracy && (
                                    <p className="text-xs text-green-600 mt-1">
                                        ✨ Better accuracy available: ±{Math.round(bestAccuracy.accuracy)}m
                                        <button
                                            onClick={() => setLocation(bestAccuracy)}
                                            className="ml-2 text-green-700 underline"
                                        >
                                            Use
                                        </button>
                                    </p>
                                )}
                            </div>

                            {/* Location Quality Indicator */}
                            {!location.manual && locationHistory.length > 1 && (
                                <div className="bg-gray-50 rounded-xl p-2">
                                    <p className="text-xs text-gray-600 mb-1">Location history:</p>
                                    <div className="flex gap-1 overflow-x-auto">
                                        {locationHistory.map((loc, idx) => (
                                            <div
                                                key={idx}
                                                className={`w-2 h-2 rounded-full ${
                                                    loc.accuracy <= 10 ? 'bg-green-500' :
                                                    loc.accuracy <= 20 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                                }`}
                                                title={`Accuracy: ${Math.round(loc.accuracy)}m`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Static Map Preview - Improved */}
                            <div className="bg-gray-100 rounded-xl overflow-hidden border border-gray-200" style={{ aspectRatio: "4/3" }}>
                                <iframe
                                    title="Map preview"
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.005},${location.lat - 0.005},${location.lng + 0.005},${location.lat + 0.005}&layer=mapnik&marker=${location.lat},${location.lng}`}
                                    className="w-full h-full"
                                    style={{ border: 0 }}
                                    loading="lazy"
                                />
                            </div>

                            {/* Open in Maps Links */}
                            <div className="flex gap-2">
                                <a
                                    href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-blue-600 text-white text-center py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                                >
                                    Google Maps
                                </a>
                                <a
                                    href={`https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}&zoom=17`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-green-600 text-white text-center py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
                                >
                                    OpenStreetMap
                                </a>
                                {navigator.platform.includes('Mac') && (
                                    <a
                                        href={`https://maps.apple.com/?q=${location.lat},${location.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 bg-gray-800 text-white text-center py-2 rounded-xl text-sm font-semibold hover:bg-gray-900 transition-colors"
                                    >
                                        Apple Maps
                                    </a>
                                )}
                            </div>
                        </>
                    )}

                    {/* Manual Coordinate Entry */}
                    <div className="border-t border-gray-200 pt-4">
                        <p className="text-xs font-semibold text-gray-500 mb-2">Or enter coordinates manually:</p>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="number"
                                step="any"
                                placeholder="Latitude (-90 to 90)"
                                value={manualLat}
                                onChange={(e) => setManualLat(e.target.value)}
                                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                            />
                            <input
                                type="number"
                                step="any"
                                placeholder="Longitude (-180 to 180)"
                                value={manualLng}
                                onChange={(e) => setManualLng(e.target.value)}
                                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                            />
                        </div>
                        <button
                            onClick={handleManualSubmit}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-xl text-sm font-semibold transition-colors transform hover:scale-[1.02]"
                        >
                            Set Coordinates
                        </button>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                            Example: -27.123456, 22.123456
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-xl transition-all transform hover:scale-105"
                        >
                            Cancel
                        </button>
                        {location && (
                            <button
                                onClick={confirmLocation}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all transform hover:scale-105"
                            >
                                ✅ Use This Location
                            </button>
                        )}
                    </div>

                    <p className="text-xs text-gray-400 text-center">
                        {!location?.manual ? 
                            "GPS accuracy improves over time. For best results, ensure clear sky view." :
                            "Manual coordinates will be used as-is without GPS verification."
                        }
                    </p>
                </div>
            </div>
        </div>
    );
}