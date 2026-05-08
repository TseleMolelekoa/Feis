// src/components/InspectionForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import TopNav from './TopNav';
import QRScanner from './QRScanner';
import GPSLocator from './GPSLocator';
import { EQ_TYPES } from '../constants/data';

export default function InspectionForm({ equipment, user, onSubmit, onBack }) {
    const config = EQ_TYPES[equipment.type];
    const [checks, setChecks] = useState({});
    const [comments, setComments] = useState("");
    const [actions, setActions] = useState("");
    const [status, setStatus] = useState("Inspected");
    const [expiry, setExpiry] = useState("");
    const [location, setLocation] = useState(equipment.location || "");
    const [gpsLocation, setGpsLocation] = useState(null);
    const [scannedCondition, setScannedCondition] = useState(null);
    const [showLocationScanner, setShowLocationScanner] = useState(false);
    const [showSerialScanner, setShowSerialScanner] = useState(false);
    const [showConditionScanner, setShowConditionScanner] = useState(false);
    const [showGPSLocator, setShowGPSLocator] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [scannedSerial, setScannedSerial] = useState(null);
    const [photoEvidence, setPhotoEvidence] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState({});

    // Initialize checks from previous inspection if available
    useEffect(() => {
        if (equipment.lastInspection?.checks) {
            setChecks(equipment.lastInspection.checks);
        }
    }, [equipment]);

    const toggleCheck = useCallback((check) => {
        setChecks(prev => ({
            ...prev,
            [check]: prev[check] === "yes" ? "no" : prev[check] === "no" ? undefined : "yes"
        }));
        // Clear error for this check if it exists
        if (errors[check]) {
            setErrors(prev => ({ ...prev, [check]: undefined }));
        }
    }, [errors]);

    const checkValues = Object.values(checks);
    const passed = checkValues.filter(v => v === "yes").length;
    const failed = checkValues.filter(v => v === "no").length;
    const answered = checkValues.filter(Boolean).length;
    const progress = Math.round((answered / config.checks.length) * 100);
    const isComplete = answered === config.checks.length;

    const handleConditionScan = useCallback((result) => {
        if (result.type === "condition") {
            setScannedCondition(result);
            // Auto-set status based on condition
            if (result.status === "good") {
                setStatus("Inspected");
                setActions("");
            } else if (result.status === "needs_check") {
                setStatus("Action Required");
                if (!actions) setActions("Further inspection required");
            } else if (result.status === "needs_repair") {
                setStatus("Action Required");
                if (!actions) setActions("Repair required");
            } else if (result.status === "failed" || result.status === "out_of_service") {
                setStatus("Out of Service");
                if (!actions) setActions("Equipment out of service");
            } else if (result.status === "expired") {
                setStatus("Action Required");
                if (!actions) setActions("Replace expired equipment immediately");
            }
        }
        setShowConditionScanner(false);
    }, [actions]);

    const handleSerialScan = useCallback((result) => {
        if (result.type === "serial") {
            setScannedSerial(result);
            // Verify serial matches equipment
            if (result.serial !== equipment.serial) {
                setComments(prev => {
                    const warning = `⚠️ Warning: Scanned serial (${result.serial}) does not match equipment serial (${equipment.serial})`;
                    return prev.includes(warning) ? prev : prev + (prev ? "\n" : "") + warning;
                });
                setErrors(prev => ({ ...prev, serial: "Serial number mismatch!" }));
            } else {
                setErrors(prev => ({ ...prev, serial: undefined }));
            }
        }
        setShowSerialScanner(false);
    }, [equipment.serial]);

    const handleLocationScan = useCallback((result) => {
        if (result.type === "location") {
            setLocation(result.location);
            if (result.coordinates) {
                setGpsLocation(result.coordinates);
            }
        }
        setShowLocationScanner(false);
    }, []);

    const handleGPSLocation = useCallback((locationData) => {
        setGpsLocation(locationData);
        setLocation(locationData.coordinates);
        setShowGPSLocator(false);
    }, []);

    const validateForm = useCallback(() => {
        const newErrors = {};
        
        // Check if all checklist items are answered
        if (!isComplete) {
            newErrors.checklist = `Please complete all checklist items (${answered}/${config.checks.length} completed)`;
        }
        
        // Check if serial is verified for critical equipment
        if (equipment.type === 'fire_extinguisher' && !scannedSerial) {
            newErrors.serial = "Please verify serial number for safety equipment";
        }
        
        // Check if condition is scanned for failed items
        if (failed > 0 && !scannedCondition) {
            newErrors.condition = "Please scan condition code for failed items";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [isComplete, answered, config.checks.length, equipment.type, failed, scannedSerial, scannedCondition]);

    const handleSubmit = useCallback(async () => {
        if (!validateForm()) {
            // Scroll to first error
            const firstError = document.querySelector('.error-message');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setIsSaving(true);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        const inspectionData = {
            id: `INS-${Date.now()}`,
            equipmentId: equipment.id,
            equipmentType: equipment.type,
            site: equipment.site,
            area: equipment.area,
            location: location || gpsLocation?.coordinates,
            gpsLocation: gpsLocation,
            checks,
            comments,
            actions,
            status,
            expiry,
            scannedCondition: scannedCondition,
            scannedSerial: scannedSerial,
            photoEvidence: photoEvidence,
            inspector: user?.name || "Unknown",
            inspectorId: user?.id,
            ts: new Date().toISOString(),
            isComplete: isComplete,
            passedCount: passed,
            failedCount: failed
        };
        
        setIsSubmitted(true);
        onSubmit(inspectionData);
    }, [validateForm, equipment, location, gpsLocation, checks, comments, actions, status, expiry, 
        scannedCondition, scannedSerial, photoEvidence, user, onSubmit, passed, failed, isComplete]);

    // Auto-save draft to localStorage
    useEffect(() => {
        if (!isSubmitted && !isSaving) {
            const draft = {
                checks,
                comments,
                actions,
                status,
                expiry,
                location,
                gpsLocation,
                scannedCondition,
                scannedSerial,
                timestamp: Date.now()
            };
            localStorage.setItem(`inspection_draft_${equipment.id}`, JSON.stringify(draft));
        }
    }, [checks, comments, actions, status, expiry, location, gpsLocation, scannedCondition, scannedSerial, equipment.id, isSubmitted, isSaving]);

    // Load draft on mount
    useEffect(() => {
        const draft = localStorage.getItem(`inspection_draft_${equipment.id}`);
        if (draft) {
            const draftData = JSON.parse(draft);
            const draftAge = Date.now() - draftData.timestamp;
            // Only load draft if less than 24 hours old
            if (draftAge < 24 * 60 * 60 * 1000) {
                if (window.confirm('You have a saved draft from earlier. Load it?')) {
                    setChecks(draftData.checks || {});
                    setComments(draftData.comments || "");
                    setActions(draftData.actions || "");
                    setStatus(draftData.status || "Inspected");
                    setExpiry(draftData.expiry || "");
                    setLocation(draftData.location || equipment.location);
                    setGpsLocation(draftData.gpsLocation || null);
                    setScannedCondition(draftData.scannedCondition || null);
                    setScannedSerial(draftData.scannedSerial || null);
                }
            }
            // Clear old draft
            localStorage.removeItem(`inspection_draft_${equipment.id}`);
        }
    }, [equipment.id, equipment.location]);

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
                <div className="text-center animate-in fade-in zoom-in duration-500">
                    <div className="text-7xl mb-4 animate-bounce">✅</div>
                    <h2 className="text-xl font-bold text-gray-800">Inspection Submitted!</h2>
                    <p className="text-gray-500 text-sm mt-2">Redirecting to dashboard...</p>
                    <div className="mt-4 w-32 h-1 bg-gray-200 rounded-full overflow-hidden mx-auto">
                        <div className="h-full bg-green-500 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <TopNav
                title={`${config.emoji} ${config.short} Inspection`}
                subtitle={`${equipment.id} · ${equipment.area}`}
                onBack={onBack}
            />

            <div className="max-w-2xl mx-auto p-4 space-y-4 pb-8">
                {/* Error Summary */}
                {Object.keys(errors).length > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-3 animate-shake">
                        <p className="text-xs font-semibold text-red-800 mb-1">Please fix the following:</p>
                        <ul className="text-xs text-red-700 space-y-1">
                            {Object.values(errors).map((error, idx) => (
                                <li key={idx} className="flex items-start gap-1">
                                    <span>⚠️</span>
                                    <span>{error}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500">Checklist Progress</span>
                        <span className="text-xs font-bold text-gray-700">{progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${
                                progress === 100 ? "bg-green-500" : "bg-red-500"
                            }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className="text-xs text-green-600 font-semibold">✅ {passed} passed</span>
                        <span className="text-xs text-gray-500">{answered}/{config.checks.length} completed</span>
                        {failed > 0 && <span className="text-xs text-red-600 font-semibold">❌ {failed} failed</span>}
                    </div>
                </div>

                {/* Equipment Details with Serial Verification */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Equipment Details</p>
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                        {[
                            ["ID", equipment.id],
                            ["Site", equipment.site],
                            ["Area", equipment.area],
                            ["Dept", equipment.dept],
                            ["Serial", equipment.serial],
                            ["Model", equipment.model || "N/A"],
                            ["Manufacturer", equipment.manufacturer || "N/A"]
                        ].map(([label, value]) => (
                            <div key={label}>
                                <span className="text-gray-400 text-xs block">{label}</span>
                                <span className="font-semibold text-gray-800 text-sm">{value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Serial Number Verification */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                                Verify Serial Number {equipment.type === 'fire_extinguisher' && <span className="text-red-500">*</span>}
                            </p>
                            <button
                                onClick={() => setShowSerialScanner(true)}
                                className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-700 transition-all transform hover:scale-105 flex items-center gap-1"
                            >
                                📷 Scan QR
                            </button>
                        </div>
                        {scannedSerial && (
                            <div className={`mt-2 p-3 rounded-xl text-xs ${
                                scannedSerial.serial === equipment.serial
                                    ? "bg-green-50 border border-green-200 text-green-700"
                                    : "bg-red-50 border border-red-200 text-red-700"
                            }`}>
                                <div className="flex items-start gap-2">
                                    <span>{scannedSerial.serial === equipment.serial ? "✅" : "⚠️"}</span>
                                    <div className="flex-1">
                                        <p className="font-semibold">Scanned Serial: {scannedSerial.serial}</p>
                                        {scannedSerial.serial === equipment.serial ? (
                                            <p className="mt-1">Serial number verified ✓</p>
                                        ) : (
                                            <p className="mt-1">Serial number mismatch! Please verify equipment identity.</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setScannedSerial(null)}
                                        className="text-xs text-gray-500 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Location with GPS */}
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Location</p>
                    <div className="flex gap-2 mb-2">
                        <input
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Scan QR, use GPS, or type location…"
                            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                        <button
                            onClick={() => setShowLocationScanner(true)}
                            className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1"
                            title="Scan location QR"
                        >
                            📷 QR
                        </button>
                        <button
                            onClick={() => setShowGPSLocator(true)}
                            className="bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition-all flex items-center gap-1"
                            title="Get GPS location"
                        >
                            📍 GPS
                        </button>
                    </div>
                    {gpsLocation && (
                        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                            📍 GPS: {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)}
                            {gpsLocation.accuracy > 0 && ` (accuracy: ±${Math.round(gpsLocation.accuracy)}m)`}
                        </div>
                    )}
                </div>

                {/* Scan Condition */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-800">Scan Item Condition</p>
                            <p className="text-xs text-gray-400 mt-0.5">Scan condition code or QR (OK, FAIL, REPAIR, etc.)</p>
                        </div>
                        <button
                            onClick={() => setShowConditionScanner(true)}
                            className="bg-orange-500 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-orange-600 transition-all transform hover:scale-105 flex items-center gap-1"
                        >
                            📷 Scan Condition
                        </button>
                    </div>
                    {scannedCondition && (
                        <div className={`mt-3 p-3 rounded-xl border transition-all ${
                            scannedCondition.status === "good" ? "bg-green-50 border-green-200" :
                                scannedCondition.status === "needs_check" ? "bg-yellow-50 border-yellow-200" :
                                    scannedCondition.status === "needs_repair" ? "bg-orange-50 border-orange-200" :
                                        "bg-red-50 border-red-200"
                        }`}>
                            <div className="flex items-start gap-2">
                                <span className="text-lg">
                                    {scannedCondition.status === "good" ? "✅" :
                                        scannedCondition.status === "needs_check" ? "⚠️" :
                                            scannedCondition.status === "needs_repair" ? "🔧" : "❌"}
                                </span>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">Condition: {scannedCondition.code}</p>
                                    <p className="text-xs mt-1">{scannedCondition.description}</p>
                                </div>
                                <button
                                    onClick={() => setScannedCondition(null)}
                                    className="text-xs text-red-500 hover:text-red-700"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    )}
                    {errors.condition && (
                        <p className="text-xs text-red-500 mt-2 error-message">{errors.condition}</p>
                    )}
                </div>

                {/* Checklist */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Inspection Checklist</p>
                        <p className="text-xs text-gray-400 mt-0.5">Tap each item to toggle Yes / No</p>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
                        {config.checks.map((check, index) => {
                            const value = checks[check];
                            return (
                                <button
                                    key={index}
                                    onClick={() => toggleCheck(check)}
                                    className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors border-l-4 text-left ${
                                        value === "yes"
                                            ? "border-green-400 bg-green-50"
                                            : value === "no"
                                                ? "border-red-400 bg-red-50"
                                                : "border-transparent bg-white hover:bg-gray-50"
                                    }`}
                                >
                                    <span className="text-sm text-gray-700 flex-1 pr-3">{check}</span>
                                    <div className="flex gap-1.5 flex-shrink-0">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                            value === "yes" ? "bg-green-500 text-white scale-105" : "bg-gray-100 text-gray-400"
                                        }`}>
                                            YES
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                            value === "no" ? "bg-red-500 text-white scale-105" : "bg-gray-100 text-gray-400"
                                        }`}>
                                            NO
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    {errors.checklist && (
                        <div className="p-3 bg-red-50 border-t border-red-100">
                            <p className="text-xs text-red-600 error-message">{errors.checklist}</p>
                        </div>
                    )}
                </div>

                {/* Expiry Date (Fire Extinguisher only) */}
                {equipment.type === "fire_extinguisher" && (
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-2">
                            Expiry Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="month"
                            value={expiry}
                            onChange={(e) => setExpiry(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-red-400"
                            required
                        />
                        <p className="text-xs text-gray-400 mt-1">Select the month and year of expiry</p>
                    </div>
                )}

                {/* Status and Comments */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Status</p>
                        <div className="flex gap-2">
                            {["Inspected", "Action Required", "Out of Service"].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStatus(s)}
                                    className={`flex-1 text-xs py-2 px-1 rounded-xl border font-bold transition-all transform hover:scale-105 ${
                                        status === s
                                            ? s === "Inspected"
                                                ? "bg-green-500 text-white border-green-500 shadow-md"
                                                : s === "Action Required"
                                                    ? "bg-orange-500 text-white border-orange-500 shadow-md"
                                                    : "bg-red-600 text-white border-red-600 shadow-md"
                                            : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-2">
                            Comments
                        </label>
                        <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            rows={2}
                            placeholder="General comments, observations, or notes…"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-2">
                            Actions Required
                        </label>
                        <textarea
                            value={actions}
                            onChange={(e) => setActions(e.target.value)}
                            rows={2}
                            placeholder="List any corrective actions required…"
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg transition-all text-sm tracking-wide flex items-center justify-center gap-2 ${
                        isSaving 
                            ? "bg-gray-400 cursor-not-allowed" 
                            : isComplete 
                                ? "bg-green-600 hover:bg-green-700 active:scale-95" 
                                : "bg-red-600 hover:bg-red-700 active:scale-95"
                    }`}
                >
                    {isSaving ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            SUBMITTING...
                        </>
                    ) : (
                        <>
                            {isComplete ? "✅" : "⚠️"} SUBMIT INSPECTION REPORT
                        </>
                    )}
                </button>
                
                {!isComplete && (
                    <p className="text-xs text-center text-gray-400">
                        Please complete all checklist items before submitting
                    </p>
                )}
                
                <div className="h-4" />
            </div>

            {/* Scanners */}
            {showLocationScanner && (
                <QRScanner
                    title="Scan Location"
                    hint="Scan location QR code or barcode"
                    mode="location"
                    onScan={handleLocationScan}
                    onClose={() => setShowLocationScanner(false)}
                />
            )}
            {showSerialScanner && (
                <QRScanner
                    title="Verify Serial Number"
                    hint="Scan equipment serial number QR code"
                    mode="serial"
                    onScan={handleSerialScan}
                    onClose={() => setShowSerialScanner(false)}
                />
            )}
            {showConditionScanner && (
                <QRScanner
                    title="Scan Condition Code"
                    hint="Scan condition code (OK, FAIL, REPAIR, etc.)"
                    mode="condition"
                    onScan={handleConditionScan}
                    onClose={() => setShowConditionScanner(false)}
                />
            )}
            {showGPSLocator && (
                <GPSLocator
                    onLocationSelect={handleGPSLocation}
                    onClose={() => setShowGPSLocator(false)}
                />
            )}
        </div>
    );
}