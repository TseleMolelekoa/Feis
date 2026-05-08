// src/components/QRScanner.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';

// Pre-defined condition codes for quick scanning
const CONDITION_CODES = {
    "OK": { status: "good", description: "Equipment in good condition", color: "green" },
    "GOOD": { status: "good", description: "Equipment in good condition", color: "green" },
    "PASS": { status: "good", description: "Equipment passed inspection", color: "green" },
    "CHECK": { status: "needs_check", description: "Requires further inspection", color: "yellow" },
    "REPAIR": { status: "needs_repair", description: "Requires repair", color: "orange" },
    "FAIL": { status: "failed", description: "Failed inspection", color: "red" },
    "OOS": { status: "out_of_service", description: "Out of service", color: "red" },
    "EXPIRED": { status: "expired", description: "Expired - replace immediately", color: "red" },
    "NEW": { status: "new", description: "New equipment - first inspection", color: "blue" },
    "SERVICE": { status: "service_due", description: "Service due soon", color: "yellow" }
};

// Pre-defined location codes
const LOCATION_CODES = {
    "MAIN_GATE": "Main Gate Area",
    "PARKING": "Parking Area",
    "ADMIN": "Admin Building",
    "WORKSHOP": "Workshop",
    "WAREHOUSE": "Warehouse",
    "CRUSHER": "Crusher Area",
    "PLANT": "Processing Plant",
    "SHAFT": "Mine Shaft",
    "CONTROL": "Control Room",
    "LOADING": "Loading Zone",
    "RECEPTION": "Reception Area",
    "TOOL_ROOM": "Tool Room",
    "BAY_1": "Bay 1",
    "BAY_2": "Bay 2",
    "BAY_3": "Bay 3",
    "LEVEL_2": "Level 2",
    "LEVEL_3": "Level 3",
    "LEVEL_4": "Level 4",
    "LEVEL_5": "Level 5",
    "ZONE_A": "Zone A",
    "ZONE_B": "Zone B",
    "ZONE_C": "Zone C"
};

export default function QRScanner({
                                      title,
                                      hint,
                                      onScan,
                                      onClose,
                                      onCapture,
                                      mode = "default",
                                      enableCapture = true,
                                      captureMode = "both" // "qr", "camera", "both"
                                  }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const photoCanvasRef = useRef(null);
    const streamRef = useRef(null);
    const rafRef = useRef(null);
    const [cameraError, setCameraError] = useState("");
    const [isLive, setIsLive] = useState(false);
    const [manualCode, setManualCode] = useState("");
    const [scanLine, setScanLine] = useState(0);
    const [scanning, setScanning] = useState(true);
    const [lastScanned, setLastScanned] = useState(null);
    const [scannedData, setScannedData] = useState(null);
    const [activeTab, setActiveTab] = useState(captureMode === "camera" ? "camera" : "qr");
    const [capturedPhoto, setCapturedPhoto] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [facingMode, setFacingMode] = useState("environment"); // "user" for front, "environment" for back
    const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
    const [availableCameras, setAvailableCameras] = useState([]);
    const [currentCameraIndex, setCurrentCameraIndex] = useState(0);

    // Get available camera devices
    const getAvailableCameras = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setAvailableCameras(videoDevices);
            return videoDevices;
        } catch (err) {
            console.error("Error enumerating cameras:", err);
            return [];
        }
    }, []);

    // Stop camera and clean up
    const stopCamera = useCallback(() => {
        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                track.enabled = false;
            });
            streamRef.current = null;
        }
        setIsLive(false);
    }, []);

    // Switch camera
    const switchCamera = useCallback(async () => {
        setIsSwitchingCamera(true);
        
        // Stop current stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Toggle facing mode
        const newFacingMode = facingMode === "environment" ? "user" : "environment";
        setFacingMode(newFacingMode);
        
        // If we have multiple cameras, cycle through them
        if (availableCameras.length > 1) {
            const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
            setCurrentCameraIndex(nextIndex);
        }
        
        // Reinitialize camera with new facing mode
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { exact: newFacingMode },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            if (videoRef.current) {
                streamRef.current = stream;
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute("playsinline", true);
                
                await new Promise((resolve) => {
                    videoRef.current.onloadedmetadata = () => {
                        resolve();
                    };
                });
                
                await videoRef.current.play();
                setIsLive(true);
                
                // Restart scanning if in QR mode
                if (activeTab === "qr" && scanning && !scannedData) {
                    setTimeout(() => startScanning(), 100);
                }
            }
        } catch (err) {
            console.error("Error switching camera:", err);
            // Fallback to default camera without specific facing mode
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });
                
                if (videoRef.current) {
                    streamRef.current = stream;
                    videoRef.current.srcObject = stream;
                    videoRef.current.setAttribute("playsinline", true);
                    await videoRef.current.play();
                    setIsLive(true);
                }
            } catch (fallbackErr) {
                setCameraError("Failed to switch camera. Please refresh the page.");
            }
        } finally {
            setIsSwitchingCamera(false);
        }
    }, [facingMode, availableCameras, currentCameraIndex, activeTab, scanning, scannedData]);

    // Capture photo from video stream
    const capturePhoto = useCallback(() => {
        const video = videoRef.current;
        const photoCanvas = photoCanvasRef.current;
        
        if (!video || !photoCanvas || !isLive) {
            console.error("Cannot capture: video or canvas not ready");
            return;
        }

        try {
            const context = photoCanvas.getContext('2d');
            photoCanvas.width = video.videoWidth;
            photoCanvas.height = video.videoHeight;
            
            // For front camera, mirror the image
            if (facingMode === "user") {
                context.translate(photoCanvas.width, 0);
                context.scale(-1, 1);
            }
            
            context.drawImage(video, 0, 0, photoCanvas.width, photoCanvas.height);
            
            // Reset transformation
            if (facingMode === "user") {
                context.setTransform(1, 0, 0, 1, 0, 0);
            }
            
            // Convert to JPEG
            const photoData = photoCanvas.toDataURL('image/jpeg', 0.9);
            setCapturedPhoto(photoData);
            
            // Create file from data URL
            const byteString = atob(photoData.split(',')[1]);
            const mimeString = photoData.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeString });
            const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            
            // Call onCapture callback if provided
            if (onCapture) {
                onCapture({
                    dataURL: photoData,
                    file: file,
                    blob: blob,
                    timestamp: Date.now(),
                    facingMode: facingMode
                });
            }
            
            // Show feedback
            const captureFeedback = document.createElement('div');
            captureFeedback.className = 'fixed inset-0 pointer-events-none flex items-center justify-center z-50';
            captureFeedback.innerHTML = '<div class="bg-white/30 backdrop-blur-sm rounded-full p-4 animate-ping"><div class="bg-white rounded-full w-16 h-16 flex items-center justify-center"><span class="text-2xl">📸</span></div></div>';
            document.body.appendChild(captureFeedback);
            setTimeout(() => {
                document.body.removeChild(captureFeedback);
            }, 500);
            
        } catch (err) {
            console.error("Error capturing photo:", err);
            setCameraError("Failed to capture photo. Please try again.");
        }
    }, [isLive, onCapture, facingMode]);

    // Handle scan result
    const handleScanResult = useCallback((data) => {
        if (lastScanned === data || !scanning) return;
        setLastScanned(data);
        setScanning(false);

        let result = null;

        // Process based on scan mode
        if (mode === "condition") {
            const upperData = data.toUpperCase();
            if (CONDITION_CODES[upperData]) {
                result = {
                    type: "condition",
                    code: data,
                    ...CONDITION_CODES[upperData]
                };
            } else {
                const parts = data.split('|');
                if (parts.length >= 2 && CONDITION_CODES[parts[0].toUpperCase()]) {
                    result = {
                        type: "condition",
                        code: parts[0],
                        ...CONDITION_CODES[parts[0].toUpperCase()],
                        notes: parts[1]
                    };
                } else {
                    result = {
                        type: "condition",
                        code: data,
                        status: "custom",
                        description: data,
                        color: "gray"
                    };
                }
            }
        } else if (mode === "serial") {
            let serial = data.trim();
            const prefixes = ["KM/", "S/N:", "SN:", "SERIAL:", "ID:", "EQ:"];
            for (const prefix of prefixes) {
                if (serial.toUpperCase().startsWith(prefix.toUpperCase())) {
                    serial = serial.substring(prefix.length).trim();
                    break;
                }
            }
            result = {
                type: "serial",
                serial: serial,
                raw: data
            };
        } else if (mode === "location") {
            const upperData = data.toUpperCase();
            if (LOCATION_CODES[upperData]) {
                result = {
                    type: "location",
                    code: data,
                    location: LOCATION_CODES[upperData]
                };
            } else {
                const coordMatch = data.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
                if (coordMatch) {
                    result = {
                        type: "location",
                        location: `${coordMatch[1]}, ${coordMatch[2]}`,
                        coordinates: { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) },
                        raw: data
                    };
                } else {
                    result = {
                        type: "location",
                        location: data,
                        raw: data
                    };
                }
            }
        } else {
            const upperData = data.toUpperCase();
            if (CONDITION_CODES[upperData]) {
                result = {
                    type: "condition",
                    code: data,
                    ...CONDITION_CODES[upperData]
                };
            } else if (LOCATION_CODES[upperData]) {
                result = {
                    type: "location",
                    code: data,
                    location: LOCATION_CODES[upperData]
                };
            } else {
                const coordMatch = data.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
                if (coordMatch) {
                    result = {
                        type: "location",
                        location: `${coordMatch[1]}, ${coordMatch[2]}`,
                        coordinates: { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) },
                        raw: data
                    };
                } else {
                    result = {
                        type: "serial",
                        serial: data,
                        raw: data
                    };
                }
            }
        }

        setScannedData(result);
        stopCamera();
    }, [mode, lastScanned, scanning, stopCamera]);

    // Start scanning loop
    const startScanning = useCallback(() => {
        if (!jsQR || !scanning || activeTab !== "qr") {
            return;
        }

        const scan = () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            
            if (!video || !canvas || !jsQR || !scanning) {
                if (scanning && !scannedData && activeTab === "qr") {
                    rafRef.current = requestAnimationFrame(scan);
                }
                return;
            }

            if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
                try {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext("2d");
                    
                    // For front camera in QR mode, we need to handle mirroring
                    if (facingMode === "user") {
                        ctx.translate(canvas.width, 0);
                        ctx.scale(-1, 1);
                    }
                    
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    // Reset transformation
                    if (facingMode === "user") {
                        ctx.setTransform(1, 0, 0, 1, 0, 0);
                    }
                    
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);

                    if (code && code.data && scanning) {
                        handleScanResult(code.data);
                        return;
                    }
                } catch (err) {
                    console.error("Error during scan:", err);
                }
            }

            if (scanning && !scannedData && activeTab === "qr") {
                rafRef.current = requestAnimationFrame(scan);
            }
        };

        if (scanning && !scannedData && activeTab === "qr") {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            rafRef.current = requestAnimationFrame(scan);
        }
    }, [scanning, scannedData, handleScanResult, activeTab, facingMode]);

    // Initialize camera
    useEffect(() => {
        let isMounted = true;

        const initCamera = async () => {
            try {
                if (streamRef.current) {
                    return;
                }

                // Get available cameras first
                await getAvailableCameras();

                const constraints = {
                    video: {
                        facingMode: { exact: facingMode },
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints);

                if (isMounted && videoRef.current) {
                    streamRef.current = stream;
                    videoRef.current.srcObject = stream;
                    videoRef.current.setAttribute("playsinline", true);

                    await new Promise((resolve) => {
                        videoRef.current.onloadedmetadata = () => {
                            resolve();
                        };
                    });

                    await videoRef.current.play();
                    setIsLive(true);
                    
                    setTimeout(() => {
                        if (isMounted && activeTab === "qr") {
                            startScanning();
                        }
                    }, 100);
                }
            } catch (err) {
                console.error("Camera error:", err);
                // Fallback to default camera without specific facing mode
                try {
                    const fallbackStream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            width: { ideal: 1280 },
                            height: { ideal: 720 }
                        }
                    });
                    
                    if (isMounted && videoRef.current) {
                        streamRef.current = fallbackStream;
                        videoRef.current.srcObject = fallbackStream;
                        videoRef.current.setAttribute("playsinline", true);
                        await videoRef.current.play();
                        setIsLive(true);
                        
                        setTimeout(() => {
                            if (isMounted && activeTab === "qr") {
                                startScanning();
                            }
                        }, 100);
                    }
                } catch (fallbackErr) {
                    if (isMounted) {
                        let errorMessage = "Unable to access camera.";
                        if (err.name === "NotAllowedError") {
                            errorMessage = "Camera permission denied. Please allow camera access and try again.";
                        } else if (err.name === "NotFoundError") {
                            errorMessage = "No camera found on this device.";
                        } else if (err.name === "NotReadableError") {
                            errorMessage = "Camera is already in use by another application.";
                        }
                        setCameraError(errorMessage);
                    }
                }
            }
        };

        initCamera();

        let intervalId = null;
        if (!scannedData && activeTab === "qr") {
            intervalId = setInterval(() => {
                setScanLine(prev => (prev + 2) % 100);
            }, 30);
        }

        return () => {
            isMounted = false;
            if (intervalId) clearInterval(intervalId);
            stopCamera();
        };
    }, [startScanning, stopCamera, scannedData, activeTab, facingMode, getAvailableCameras]);

    useEffect(() => {
        if (jsQR && isLive && scanning && !scannedData && activeTab === "qr") {
            startScanning();
        }
    }, [jsQR, isLive, scanning, scannedData, startScanning, activeTab]);

    const handleManualSubmit = () => {
        if (manualCode.trim()) {
            setScanning(false);
            handleScanResult(manualCode.trim());
        }
    };

    const handlePhotoConfirm = () => {
        if (capturedPhoto && onScan) {
            onScan({
                type: "photo",
                dataURL: capturedPhoto,
                timestamp: Date.now(),
                facingMode: facingMode
            });
        }
        onClose();
    };

    const handleRetakePhoto = () => {
        setCapturedPhoto(null);
        setIsCapturing(false);
    };

    const getModeTitle = () => {
        switch(mode) {
            case "serial": return "Scan Serial Number";
            case "condition": return "Scan Condition Code";
            case "location": return "Scan Location Code";
            default: return title || "Scan QR Code";
        }
    };

    const getModeHint = () => {
        switch(mode) {
            case "serial": return "Point camera at equipment serial number QR code or barcode";
            case "condition": return "Scan condition code (OK, FAIL, REPAIR, etc.) or QR code";
            case "location": return "Scan location QR code, barcode, or take a photo";
            default: return hint || "Position QR code in frame or take a photo";
        }
    };

    const getConditionColor = (color) => {
        const colors = {
            green: "bg-green-100 border-green-400 text-green-700",
            yellow: "bg-yellow-100 border-yellow-400 text-yellow-700",
            orange: "bg-orange-100 border-orange-400 text-orange-700",
            red: "bg-red-100 border-red-400 text-red-700",
            blue: "bg-blue-100 border-blue-400 text-blue-700",
            gray: "bg-gray-100 border-gray-400 text-gray-700"
        };
        return colors[color] || colors.gray;
    };

    const conditionQuickButtons = [
        { code: "OK", label: "✅ Good", color: "green", description: "Equipment in good condition" },
        { code: "CHECK", label: "⚠️ Check", color: "yellow", description: "Requires further inspection" },
        { code: "REPAIR", label: "🔧 Repair", color: "orange", description: "Requires repair" },
        { code: "FAIL", label: "❌ Fail", color: "red", description: "Failed inspection" },
        { code: "EXPIRED", label: "⏰ Expired", color: "red", description: "Expired - replace immediately" },
        { code: "SERVICE", label: "🛠️ Service", color: "yellow", description: "Service due soon" }
    ];

    return (
        <div
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)" }}
            className="flex items-center justify-center p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 flex items-center justify-between">
                    <div>
                        <p className="text-white font-semibold text-sm">{getModeTitle()}</p>
                        <p className="text-red-200 text-xs">{getModeHint()}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white text-3xl w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-500 transition-colors leading-none"
                        aria-label="Close"
                    >
                        &times;
                    </button>
                </div>

                <div className="p-4">
                    {!scannedData && !capturedPhoto ? (
                        <>
                            {/* Tab selector for QR/Camera modes */}
                            {enableCapture && captureMode === "both" && (
                                <div className="flex gap-2 mb-4 bg-gray-100 rounded-xl p-1">
                                    <button
                                        onClick={() => {
                                            setActiveTab("qr");
                                            setCapturedPhoto(null);
                                            setScanning(true);
                                            setIsCapturing(false);
                                            setTimeout(() => startScanning(), 100);
                                        }}
                                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                                            activeTab === "qr"
                                                ? "bg-red-600 text-white shadow-md"
                                                : "text-gray-600 hover:bg-gray-200"
                                        }`}
                                    >
                                        📷 Scan QR
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveTab("camera");
                                            setScanning(false);
                                        }}
                                        className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                                            activeTab === "camera"
                                                ? "bg-red-600 text-white shadow-md"
                                                : "text-gray-600 hover:bg-gray-200"
                                        }`}
                                    >
                                        📸 Take Photo
                                    </button>
                                </div>
                            )}

                            {/* Camera View */}
                            <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-4 shadow-inner" style={{ aspectRatio: "1" }}>
                                <video
                                    ref={videoRef}
                                    className="w-full h-full object-cover"
                                    playsInline
                                    muted
                                    style={{
                                        transform: facingMode === "user" && activeTab === "camera" ? "scaleX(-1)" : "none"
                                    }}
                                />
                                <canvas ref={canvasRef} className="hidden" />
                                <canvas ref={photoCanvasRef} className="hidden" />

                                {/* Camera Switch Button */}
                                {isLive && !cameraError && (
                                    <button
                                        onClick={switchCamera}
                                        disabled={isSwitchingCamera}
                                        className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/70 transition-all transform hover:scale-105 z-10"
                                        title="Switch Camera"
                                    >
                                        {isSwitchingCamera ? (
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                        ) : (
                                            <span className="text-lg">🔄</span>
                                        )}
                                    </button>
                                )}

                                {isLive && !cameraError && activeTab === "qr" && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="relative w-48 h-48">
                                            {/* Corner brackets */}
                                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-red-500 rounded-tl-lg" />
                                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-red-500 rounded-tr-lg" />
                                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-red-500 rounded-bl-lg" />
                                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-red-500 rounded-br-lg" />
                                            {/* Scan line */}
                                            <div
                                                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent"
                                                style={{ top: `${scanLine}%`, transition: "top 30ms linear" }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === "camera" && isLive && !cameraError && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <button
                                            onClick={capturePhoto}
                                            className="bg-white/30 backdrop-blur-sm rounded-full p-4 hover:bg-white/40 transition-all transform hover:scale-110"
                                        >
                                            <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg">
                                                <div className="w-14 h-14 rounded-full border-4 border-red-500"></div>
                                            </div>
                                        </button>
                                    </div>
                                )}

                                {!isLive && !cameraError && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-500 border-t-transparent"></div>
                                        <p className="text-gray-400 text-sm mt-3">Starting camera...</p>
                                    </div>
                                )}
                            </div>

                            {/* Camera Capture Button for Camera Tab */}
                            {activeTab === "camera" && isLive && !cameraError && (
                                <button
                                    onClick={capturePhoto}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl mb-4 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    <span className="text-xl">📸</span>
                                    Capture Photo
                                </button>
                            )}

                            {/* Camera Info */}
                            {isLive && !cameraError && (
                                <div className="text-center mb-3">
                                    <p className="text-xs text-gray-500">
                                        {facingMode === "environment" ? "📷 Back Camera" : "🤳 Front Camera"}
                                        {availableCameras.length > 1 && " • Tap 🔄 to switch"}
                                    </p>
                                </div>
                            )}

                            {/* Error Message */}
                            {cameraError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-3">
                                    <div className="flex items-start gap-2">
                                        <span className="text-lg">⚠️</span>
                                        <div className="flex-1">
                                            <p className="font-semibold">Camera Error</p>
                                            <p className="text-xs mt-1">{cameraError}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quick condition buttons for condition mode */}
                            {mode === "condition" && activeTab === "qr" && (
                                <div className="mb-4">
                                    <p className="text-xs font-semibold text-gray-500 mb-2">Quick Condition Codes:</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {conditionQuickButtons.map(btn => (
                                            <button
                                                key={btn.code}
                                                onClick={() => handleScanResult(btn.code)}
                                                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all transform hover:scale-105 ${
                                                    btn.color === "green" ? "bg-green-100 text-green-700 hover:bg-green-200" :
                                                        btn.color === "yellow" ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" :
                                                            btn.color === "orange" ? "bg-orange-100 text-orange-700 hover:bg-orange-200" :
                                                                "bg-red-100 text-red-700 hover:bg-red-200"
                                                }`}
                                                title={btn.description}
                                            >
                                                {btn.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Manual Entry */}
                            {activeTab === "qr" && (
                                <div className="border-t border-gray-200 pt-4">
                                    <p className="text-center text-gray-400 text-xs mb-3">— or enter manually —</p>
                                    <div className="flex gap-2">
                                        <input
                                            value={manualCode}
                                            onChange={(e) => setManualCode(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                                            placeholder={
                                                mode === "condition" ? "Enter condition code (OK, FAIL, REPAIR, etc.)" :
                                                    mode === "serial" ? "Enter serial number" :
                                                        mode === "location" ? "Enter location or coordinates" :
                                                            "Enter code manually…"
                                            }
                                            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                                            autoFocus={false}
                                        />
                                        <button
                                            onClick={handleManualSubmit}
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all transform hover:scale-105"
                                        >
                                            Go
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : capturedPhoto && !scannedData ? (
                        // Show captured photo preview
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <div className="rounded-xl overflow-hidden border-2 border-gray-200">
                                <img
                                    src={capturedPhoto}
                                    alt="Captured"
                                    className="w-full h-auto"
                                />
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={handleRetakePhoto}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition-all text-sm"
                                >
                                    🔄 Retake Photo
                                </button>
                                <button
                                    onClick={handlePhotoConfirm}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all text-sm transform hover:scale-105"
                                >
                                    ✅ Use This Photo
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Show scanned result with confirmation
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <div className={`rounded-xl p-4 border-2 ${getConditionColor(scannedData.color)}`}>
                                <div className="flex items-start gap-3">
                                    <div className="text-3xl">
                                        {scannedData.type === "condition" ? (
                                            scannedData.status === "good" ? "✅" :
                                                scannedData.status === "failed" ? "❌" :
                                                    scannedData.status === "needs_repair" ? "🔧" :
                                                        scannedData.status === "expired" ? "⏰" : "📋"
                                        ) : scannedData.type === "serial" ? "🔢" : "📍"}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">
                                            {scannedData.type === "condition" ? "Condition Code" :
                                                scannedData.type === "serial" ? "Serial Number" : "Location"}
                                        </p>
                                        <p className="font-mono text-sm font-semibold mt-1 break-all">
                                            {scannedData.type === "condition" ? scannedData.code :
                                                scannedData.type === "serial" ? scannedData.serial :
                                                    scannedData.location}
                                        </p>
                                        {scannedData.description && (
                                            <p className="text-xs mt-2 text-gray-600">{scannedData.description}</p>
                                        )}
                                        {scannedData.notes && (
                                            <p className="text-xs mt-1 text-gray-500 italic">Notes: {scannedData.notes}</p>
                                        )}
                                        {scannedData.coordinates && (
                                            <p className="text-xs mt-1 text-blue-600">
                                                📍 Coordinates: {scannedData.coordinates.lat.toFixed(6)}, {scannedData.coordinates.lng.toFixed(6)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setScannedData(null);
                                        setLastScanned(null);
                                        setManualCode("");
                                        setScanning(true);
                                        setCapturedPhoto(null);
                                        setTimeout(() => {
                                            if (isLive && jsQR) {
                                                startScanning();
                                            }
                                        }, 100);
                                    }}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition-all text-sm"
                                >
                                    🔄 Scan Again
                                </button>
                                <button
                                    onClick={() => onScan(scannedData)}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all text-sm transform hover:scale-105"
                                >
                                    ✅ Use This
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Help Text */}
                    <p className="text-xs text-gray-400 text-center mt-4">
                        {mode === "condition" ? "Scan condition codes for quick inspection status" :
                            mode === "serial" ? "Scan QR code or barcode to auto-fill serial number" :
                                mode === "location" ? "Scan location QR code, take a photo, or enter coordinates" :
                                    "Scan QR code, barcode, or take a photo"}
                        {availableCameras.length > 1 && " • Tap 🔄 to switch cameras"}
                    </p>
                </div>
            </div>
        </div>
    );
}