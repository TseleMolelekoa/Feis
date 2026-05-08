// src/components/AddEquipment.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import TopNav from './TopNav';
import QRScanner from './QRScanner';
import Footer from './Footer';
import GPSLocator from './GPSLocator';
import { EQ_TYPES, SITES, DEPARTMENTS, AREAS } from '../constants/data';

export default function AddEquipment({ user, onAdd, onBack }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        type: "",
        site: user?.site !== "All Sites" ? user?.site || "" : "",
        area: "",
        location: "",
        locationCoordinates: null,
        dept: "",
        serial: "",
        metadata: {}
    });
    const [equipmentPhoto, setEquipmentPhoto] = useState(null);
    const [locationPhoto, setLocationPhoto] = useState(null);
    const [showQRScanner, setShowQRScanner] = useState(false);
    const [showGPS, setShowGPS] = useState(false);
    const [cameraType, setCameraType] = useState(null); // 'equipment', 'location', or 'qr'
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [generatedId, setGeneratedId] = useState("");

    // Generate equipment ID when type and site are selected
    const generateEquipmentId = useCallback(() => {
        if (!formData.type || !formData.site) return "";
        
        const prefix = {
            fire_extinguisher: "SE",
            fire_hydrant: "HY",
            fire_hose_reel: "HR",
            hydrant_box: "HB",
            fire_deluge: "FD",
            first_aid_box: "FA"
        }[formData.type] || "EQ";

        const siteCode = formData.site.substring(0, 2).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        const id = `KM/${prefix}${siteCode}${timestamp}`;
        setGeneratedId(id);
        return id;
    }, [formData.type, formData.site]);

    // Update generated ID when dependencies change
    useEffect(() => {
        if (formData.type && formData.site) {
            generateEquipmentId();
        }
    }, [formData.type, formData.site, generateEquipmentId]);

    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError("");
    }, []);

    const handleLocationSelect = useCallback((locationData) => {
        setFormData(prev => ({
            ...prev,
            location: locationData.coordinates,
            locationCoordinates: locationData
        }));
        setShowGPS(false);
        setError("");
    }, []);

    const handleMetadataChange = useCallback((field, value) => {
        setFormData(prev => ({
            ...prev,
            metadata: { ...prev.metadata, [field]: value }
        }));
    }, []);

    const handleQRScan = useCallback((result) => {
        console.log("QR Scan result:", result);

        // Handle photo capture from QRScanner
        if (result.type === "photo") {
            if (cameraType === 'equipment') {
                setEquipmentPhoto(result.dataURL);
            } else if (cameraType === 'location') {
                setLocationPhoto(result.dataURL);
            }
            setShowQRScanner(false);
            setCameraType(null);
            return;
        }

        // Handle regular QR scan results
        if (result.type === "serial") {
            setFormData(prev => ({
                ...prev,
                serial: result.serial
            }));
            // Show success feedback
            const feedback = document.createElement('div');
            feedback.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in zoom-in';
            feedback.innerHTML = '✅ Serial number scanned!';
            document.body.appendChild(feedback);
            setTimeout(() => feedback.remove(), 2000);
        } else if (result.type === "location") {
            setFormData(prev => ({
                ...prev,
                location: result.location,
                locationCoordinates: result.coordinates || null
            }));
            // Show success feedback
            const feedback = document.createElement('div');
            feedback.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in zoom-in';
            feedback.innerHTML = '📍 Location scanned!';
            document.body.appendChild(feedback);
            setTimeout(() => feedback.remove(), 2000);
        } else if (result.type === "condition") {
            console.log("Condition scanned:", result);
        } else {
            // Legacy handling for simple string or raw data
            const rawData = result.raw || result;
            const parts = typeof rawData === 'string' ? rawData.split('|') : [];

            if (parts.length >= 2) {
                setFormData(prev => ({
                    ...prev,
                    serial: parts[0].trim(),
                    location: parts[1].trim() || prev.location
                }));
            } else if (typeof rawData === 'string' && rawData.match(/-?\d+\.?\d*,\s*-?\d+\.?\d*/)) {
                setFormData(prev => ({
                    ...prev,
                    location: rawData
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    serial: rawData
                }));
            }
        }
        setShowQRScanner(false);
    }, [cameraType]);

    const handlePhotoCapture = useCallback((photoData) => {
        if (cameraType === 'equipment') {
            setEquipmentPhoto(photoData);
        } else if (cameraType === 'location') {
            setLocationPhoto(photoData);
        }
        setShowQRScanner(false);
        setCameraType(null);
    }, [cameraType]);

    const validateForm = useCallback(() => {
        if (!formData.type) {
            setError("Please select equipment type");
            return false;
        }
        if (!formData.site) {
            setError("Please select site");
            return false;
        }
        if (!formData.area) {
            setError("Please select area");
            return false;
        }
        if (!formData.location) {
            setError("Please enter location or capture GPS coordinates");
            return false;
        }
        if (!formData.dept) {
            setError("Please select department");
            return false;
        }
        if (!formData.serial) {
            setError("Please enter or scan serial number");
            return false;
        }

        // Validate type-specific required fields
        const selectedType = EQ_TYPES[formData.type];
        if (selectedType && selectedType.fields) {
            for (const [field, config] of Object.entries(selectedType.fields)) {
                if (config.required && !formData.metadata[field]) {
                    setError(`Please enter ${config.label}`);
                    return false;
                }
            }
        }

        setError("");
        return true;
    }, [formData]);

    const handleSubmit = useCallback(async () => {
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        
        try {
            const equipmentId = generateEquipmentId();
            const newEquipment = {
                id: equipmentId,
                type: formData.type,
                area: formData.area,
                location: formData.location,
                locationCoordinates: formData.locationCoordinates,
                site: formData.site,
                dept: formData.dept,
                serial: formData.serial,
                metadata: formData.metadata,
                photos: {
                    equipment: equipmentPhoto,
                    location: locationPhoto
                },
                registeredBy: user?.name || "Unknown",
                registeredById: user?.id,
                registeredAt: new Date().toISOString(),
                status: "Active",
                lastInspection: null,
                lastInspectionDate: null,
                inspectionCount: 0
            };

            setSuccess(true);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            onAdd(newEquipment);
        } catch (err) {
            console.error("Error submitting equipment:", err);
            setError("Failed to register equipment. Please try again.");
            setIsSubmitting(false);
        }
    }, [validateForm, generateEquipmentId, formData, equipmentPhoto, locationPhoto, user, onAdd]);

    const selectedType = useMemo(() => EQ_TYPES[formData.type], [formData.type]);

    if (success) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
                <div className="text-center animate-in fade-in zoom-in duration-500">
                    <div className="text-7xl mb-4 animate-bounce">✅</div>
                    <h2 className="text-xl font-bold text-gray-800">Equipment Registered Successfully!</h2>
                    <p className="text-gray-600 text-sm mt-2">Equipment ID: <span className="font-mono font-bold">{generatedId}</span></p>
                    <p className="text-gray-500 text-sm mt-1">Redirecting to dashboard...</p>
                    <div className="mt-4 w-32 h-1 bg-gray-200 rounded-full overflow-hidden mx-auto">
                        <div className="h-full bg-green-500 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <TopNav
                title="Add New Equipment"
                subtitle={step === 1 ? "Step 1 of 2 - Basic Information" : "Step 2 of 2 - Equipment Details"}
                onBack={onBack}
            />

            <div className="flex-1 max-w-2xl mx-auto p-4 space-y-4 pb-8">
                {/* Progress Indicator */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500">Registration Progress</span>
                        <span className="text-xs font-bold text-gray-700">{step === 1 ? "50%" : "100%"}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500 bg-red-600"
                            style={{ width: step === 1 ? "50%" : "100%" }}
                        />
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className={`text-xs ${step === 1 ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                            1. Basic Info
                        </span>
                        <span className={`text-xs ${step === 2 ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                            2. Equipment Details
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 flex items-start gap-2 animate-shake">
                        <span className="text-lg">⚠️</span>
                        <div className="flex-1">
                            <p className="font-semibold">Registration Error</p>
                            <p className="text-xs mt-1">{error}</p>
                        </div>
                        <button 
                            onClick={() => setError("")} 
                            className="text-red-500 hover:text-red-700 transition-colors"
                            aria-label="Close error"
                        >
                            ×
                        </button>
                    </div>
                )}

                {step === 1 ? (
                    // Step 1: Basic Information
                    <div className="space-y-4">
                        {/* Equipment Type */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-2">
                                Equipment Type <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(EQ_TYPES).map(([type, config]) => (
                                    <button
                                        key={type}
                                        onClick={() => handleInputChange("type", type)}
                                        className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all transform hover:scale-105 ${
                                            formData.type === type
                                                ? `${config.color} text-white border-transparent shadow-md`
                                                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                        }`}
                                    >
                                        <span className="text-xl">{config.emoji}</span>
                                        <span className="text-sm font-medium">{config.short}</span>
                                    </button>
                                ))}
                            </div>
                            {selectedType && (
                                <p className="text-xs text-gray-500 mt-2">
                                    {selectedType.description || "Select equipment type to continue"}
                                </p>
                            )}
                        </div>

                        {/* Site */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-2">
                                Site <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.site}
                                onChange={(e) => handleInputChange("site", e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                            >
                                <option value="">Select site</option>
                                {SITES.map(site => (
                                    <option key={site} value={site}>{site}</option>
                                ))}
                            </select>
                        </div>

                        {/* Area */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-2">
                                Area <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.area}
                                onChange={(e) => handleInputChange("area", e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                            >
                                <option value="">Select area</option>
                                {AREAS.map(area => (
                                    <option key={area} value={area}>{area}</option>
                                ))}
                            </select>
                        </div>

                        {/* Location with GPS, QR, and Photo */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-2">
                                Location / GPS Coordinates <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <input
                                    value={formData.location}
                                    onChange={(e) => handleInputChange("location", e.target.value)}
                                    placeholder="e.g., Zone A, Bay 1, or GPS coordinates"
                                    className="flex-1 min-w-[150px] border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                                />
                                <button
                                    onClick={() => setShowGPS(true)}
                                    className="bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition-all transform hover:scale-105 flex items-center gap-1"
                                    title="Get GPS Coordinates"
                                    type="button"
                                >
                                    📍 GPS
                                </button>
                                <button
                                    onClick={() => {
                                        setCameraType('location');
                                        setShowQRScanner(true);
                                    }}
                                    className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all transform hover:scale-105 flex items-center gap-1"
                                    title="Take Location Photo"
                                    type="button"
                                >
                                    📷 Photo
                                </button>
                                <button
                                    onClick={() => {
                                        setCameraType('qr');
                                        setShowQRScanner(true);
                                    }}
                                    className="bg-purple-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-purple-700 transition-all transform hover:scale-105 flex items-center gap-1"
                                    title="Scan Location QR"
                                    type="button"
                                >
                                    QR
                                </button>
                            </div>

                            {formData.locationCoordinates && (
                                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-green-600">📍</span>
                                                <span className="text-xs font-semibold text-green-800">GPS Coordinates Captured</span>
                                            </div>
                                            <p className="text-xs font-mono text-green-700">
                                                {formData.locationCoordinates.coordinates}
                                            </p>
                                            {formData.locationCoordinates.accuracy > 0 && (
                                                <p className="text-xs text-green-600 mt-1">
                                                    Accuracy: ±{Math.round(formData.locationCoordinates.accuracy)} meters
                                                </p>
                                            )}
                                            <div className="mt-2 flex gap-2">
                                                <a
                                                    href={`https://www.google.com/maps?q=${formData.locationCoordinates.lat},${formData.locationCoordinates.lng}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    View on Google Maps →
                                                </a>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, locationCoordinates: null, location: "" }));
                                            }}
                                            className="text-red-500 text-xs hover:text-red-700 px-2 py-1 transition-colors"
                                            type="button"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            )}

                            {locationPhoto && (
                                <div className="mt-3">
                                    <div className="relative">
                                        <img
                                            src={locationPhoto}
                                            alt="Location"
                                            className="w-full rounded-xl border border-gray-200 shadow-sm"
                                        />
                                        <button
                                            onClick={() => setLocationPhoto(null)}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                            type="button"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        Location photo captured
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Department */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-2">
                                Department <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.dept}
                                onChange={(e) => handleInputChange("dept", e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                            >
                                <option value="">Select department</option>
                                {DEPARTMENTS.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={() => setStep(2)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95"
                        >
                            Next → Equipment Details
                        </button>
                    </div>
                ) : (
                    // Step 2: Equipment Details
                    <div className="space-y-4">
                        {/* Serial Number with QR Scan */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-2">
                                Serial Number <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    value={formData.serial}
                                    onChange={(e) => handleInputChange("serial", e.target.value)}
                                    placeholder="Enter or scan serial number"
                                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                                />
                                <button
                                    onClick={() => {
                                        setCameraType('qr');
                                        setShowQRScanner(true);
                                    }}
                                    className="bg-purple-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-purple-700 transition-all transform hover:scale-105 flex items-center gap-1"
                                    title="Scan Serial Number QR"
                                    type="button"
                                >
                                    📷 Scan
                                </button>
                            </div>
                            {formData.serial && (
                                <p className="text-xs text-gray-500 mt-2">
                                    ℹ️ Serial number will be verified during inspections
                                </p>
                            )}
                        </div>

                        {/* Equipment Photo */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-2">
                                Equipment Photo
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setCameraType('equipment');
                                        setShowQRScanner(true);
                                    }}
                                    className="flex-1 bg-green-600 text-white px-3 py-3 rounded-xl text-sm font-bold hover:bg-green-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                                    type="button"
                                >
                                    📸 Take Photo
                                </button>
                            </div>
                            {equipmentPhoto && (
                                <div className="mt-3">
                                    <div className="relative">
                                        <img
                                            src={equipmentPhoto}
                                            alt="Equipment"
                                            className="w-full rounded-xl border border-gray-200 shadow-sm"
                                        />
                                        <button
                                            onClick={() => setEquipmentPhoto(null)}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                            type="button"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        Equipment photo will be attached to record
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Type-specific fields */}
                        {selectedType && selectedType.fields && Object.keys(selectedType.fields).length > 0 && (
                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-3">
                                    Equipment Specifications
                                </label>
                                <div className="space-y-3">
                                    {Object.entries(selectedType.fields).map(([field, config]) => (
                                        <div key={field}>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {config.label} {config.required && <span className="text-red-500">*</span>}
                                            </label>
                                            {config.type === "select" ? (
                                                <select
                                                    value={formData.metadata[field] || ""}
                                                    onChange={(e) => handleMetadataChange(field, e.target.value)}
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                                                >
                                                    <option value="">Select {config.label}</option>
                                                    {config.options.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : config.type === "date" ? (
                                                <input
                                                    type="date"
                                                    value={formData.metadata[field] || ""}
                                                    onChange={(e) => handleMetadataChange(field, e.target.value)}
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                                                />
                                            ) : (
                                                <input
                                                    type={config.type || "text"}
                                                    value={formData.metadata[field] || ""}
                                                    onChange={(e) => handleMetadataChange(field, e.target.value)}
                                                    placeholder={config.placeholder || `Enter ${config.label.toLowerCase()}`}
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Preview Equipment ID */}
                        {formData.type && formData.site && generatedId && (
                            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
                                <div className="flex items-start gap-2">
                                    <span className="text-blue-500 text-xl">🏷️</span>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-blue-800 uppercase tracking-widest mb-1">
                                            Generated Equipment ID
                                        </p>
                                        <p className="text-lg font-mono font-bold text-blue-900 break-all">
                                            {generatedId}
                                        </p>
                                        <p className="text-xs text-blue-600 mt-2">
                                            This unique ID will be permanently assigned to this equipment
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Summary Card */}
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                                Registration Summary
                            </p>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Type:</span>
                                    <span className="font-medium text-gray-800">
                                        {selectedType ? selectedType.label : "Not selected"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Site:</span>
                                    <span className="font-medium text-gray-800">{formData.site || "Not selected"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Area:</span>
                                    <span className="font-medium text-gray-800">{formData.area || "Not selected"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Location:</span>
                                    <span className="font-medium text-gray-800 truncate max-w-[200px]" title={formData.location}>
                                        {formData.location || "Not set"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Department:</span>
                                    <span className="font-medium text-gray-800">{formData.dept || "Not selected"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Serial:</span>
                                    <span className="font-medium text-gray-800">{formData.serial || "Not entered"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Photos:</span>
                                    <span className="font-medium text-gray-800">
                                        {equipmentPhoto ? "📸 Equipment" : ""}
                                        {equipmentPhoto && locationPhoto ? " + " : ""}
                                        {locationPhoto ? "📍 Location" : ""}
                                        {!equipmentPhoto && !locationPhoto ? "None" : ""}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-4 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-95"
                                type="button"
                            >
                                ← Back to Basic Info
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className={`flex-1 font-bold py-4 rounded-2xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 ${
                                    isSubmitting 
                                        ? "bg-gray-400 cursor-not-allowed" 
                                        : "bg-green-600 hover:bg-green-700 text-white"
                                }`}
                                type="button"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Registering...
                                    </>
                                ) : (
                                    <>
                                        <span className="text-xl">✅</span>
                                        Register Equipment
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* QR Scanner Modal - Unified for both QR scanning and camera capture */}
            {showQRScanner && (
                <QRScanner
                    title={
                        cameraType === 'equipment' ? "Take Equipment Photo" : 
                        cameraType === 'location' ? "Take Location Photo" : 
                        "Scan Equipment Information"
                    }
                    hint={
                        cameraType === 'equipment' ? "Take a clear photo of the equipment" :
                        cameraType === 'location' ? "Take a photo of the equipment installation location" :
                        "Scan equipment QR code, serial number, location code, or take a photo"
                    }
                    mode="default"
                    onScan={handleQRScan}
                    onClose={() => {
                        setShowQRScanner(false);
                        setCameraType(null);
                    }}
                    enableCapture={true}
                    captureMode={cameraType ? "camera" : "both"}
                    onCapture={handlePhotoCapture}
                />
            )}

            {/* GPS Modal */}
            {showGPS && (
                <GPSLocator
                    onLocationSelect={handleLocationSelect}
                    onClose={() => setShowGPS(false)}
                />
            )}

            {/* Footer */}
            <Footer user={user} />
        </div>
    );
}