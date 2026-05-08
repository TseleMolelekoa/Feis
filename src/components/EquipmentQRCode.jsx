// src/components/EquipmentQRCode.jsx
import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

export default function EquipmentQRCode({
  equipment,
  value,
  size = 220,
  title = 'Equipment QR Code',
  downloadLabel = 'Download QR Code',
  className = ''
}) {
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const qrValue = value || (equipment ? equipment.id : '');

  useEffect(() => {
    if (!canvasRef.current) return;

    if (!qrValue) {
      setError('No equipment ID or QR value provided.');
      return;
    }

    setError(null);
    const options = {
      width: size,
      margin: 2,
      color: {
        dark: '#111827',
        light: '#ffffff'
      }
    };

    QRCode.toCanvas(canvasRef.current, qrValue, options).catch((err) => {
      setError(err?.message || 'Failed to generate QR code.');
      console.error('EquipmentQRCode error:', err);
    });
  }, [qrValue, size]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${equipment?.id || 'equipment'}-qr.png`;
    link.click();
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {equipment?.id && (
          <p className="mt-1 text-xs text-gray-500">Equipment ID: {equipment.id}</p>
        )}
      </div>

      <div className="p-5 flex flex-col items-center gap-4">
        {error ? (
          <div className="text-sm text-red-600 text-center">{error}</div>
        ) : (
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="rounded-3xl bg-white"
            aria-label="Equipment QR code"
          />
        )}

        {equipment && (
          <div className="w-full grid grid-cols-2 gap-3 text-xs text-gray-600">
            <div>
              <p className="font-semibold text-gray-800">Type</p>
              <p>{equipment.type || 'Unknown'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Site</p>
              <p>{equipment.site || 'Unknown'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Location</p>
              <p>{equipment.location || 'Unknown'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Serial</p>
              <p>{equipment.serial || 'N/A'}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleDownload}
          disabled={!qrValue}
          className="w-full max-w-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-2xl py-2 text-sm font-semibold transition"
        >
          {downloadLabel}
        </button>
      </div>
    </div>
  );
}
