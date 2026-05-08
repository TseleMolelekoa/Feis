// src/components/EquipmentList.jsx (Updated with footer)
import React, { useState } from 'react';
import Footer from './Footer';
import TopNav from './TopNav';
import QRScanner from './QRScanner';
import { EQ_TYPES, SITES } from '../constants/data';

export default function EquipmentList({ user, equipment, onSelect, onBack, initialType }) {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState(initialType || "all");
    const [siteFilter, setSiteFilter] = useState(user.role === "admin" ? "all" : user.site);
    const [showScanner, setShowScanner] = useState(false);
    const [expandedItem, setExpandedItem] = useState(null);
    const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"

    const filtered = equipment.filter(eq => {
        const searchMatch = !search ||
            eq.id.toLowerCase().includes(search.toLowerCase()) ||
            eq.area.toLowerCase().includes(search.toLowerCase()) ||
            eq.location.toLowerCase().includes(search.toLowerCase()) ||
            eq.serial.toLowerCase().includes(search.toLowerCase());
        const typeMatch = typeFilter === "all" || eq.type === typeFilter;
        const siteMatch = siteFilter === "all" || eq.site === siteFilter;
        return searchMatch && typeMatch && siteMatch;
    });

    const handleScan = (data) => {
        const found = equipment.find(e => e.id === data);
        if (found) {
            onSelect(found);
        } else {
            setSearch(data);
        }
        setShowScanner(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <TopNav
                title="Equipment Registry"
                subtitle={`${filtered.length} items`}
                onBack={onBack}
                right={
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                            className="bg-white bg-opacity-20 text-white text-xs px-2 py-1.5 rounded-lg hover:bg-opacity-30"
                        >
                            {viewMode === "grid" ? "📋 List" : "🔲 Grid"}
                        </button>
                        <button
                            onClick={() => setShowScanner(true)}
                            className="bg-white bg-opacity-20 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-opacity-30 flex items-center gap-1 transition-colors"
                        >
                            📷 Scan QR
                        </button>
                    </div>
                }
            />

            <div className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
                {/* Search and Filters */}
                <div className="mb-6 space-y-3">
                    <div className="relative">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="🔍 Search by ID, area, location, or serial number..."
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => setTypeFilter("all")}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                                typeFilter === "all"
                                    ? "bg-red-600 text-white shadow-md"
                                    : "bg-white text-gray-600 border border-gray-200 hover:border-red-300"
                            }`}
                        >
                            All Types
                        </button>
                        {Object.entries(EQ_TYPES).map(([type, config]) => (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                                    typeFilter === type
                                        ? `${config.color} text-white shadow-md`
                                        : "bg-white text-gray-600 border border-gray-200 hover:border-red-300"
                                }`}
                            >
                                <span>{config.emoji}</span>
                                <span>{config.short}</span>
                            </button>
                        ))}
                    </div>

                    {user.role === "admin" && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            <button
                                onClick={() => setSiteFilter("all")}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                    siteFilter === "all"
                                        ? "bg-blue-600 text-white shadow-md"
                                        : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
                                }`}
                            >
                                All Sites
                            </button>
                            {SITES.map(site => (
                                <button
                                    key={site}
                                    onClick={() => setSiteFilter(site)}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                        siteFilter === site
                                            ? "bg-blue-600 text-white shadow-md"
                                            : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
                                    }`}
                                >
                                    {site}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Equipment Display */}
                {filtered.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl">
                        <p className="text-6xl mb-4">🔍</p>
                        <p className="text-lg font-medium text-gray-600">No equipment found</p>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(eq => {
                            const config = EQ_TYPES[eq.type];
                            const isExpanded = expandedItem === eq.id;
                            return (
                                <div key={eq.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all">
                                    <div className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center text-2xl flex-shrink-0 shadow-sm`}>
                                                {config.emoji}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">{eq.id}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{eq.area}</p>
                                                    </div>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${config.light} flex-shrink-0`}>
                            {config.short}
                          </span>
                                                </div>
                                                <p className="text-xs text-gray-600 mt-2">{eq.location}</p>
                                                <p className="text-xs text-gray-400 mt-1">{eq.site} · {eq.dept}</p>
                                                {eq.locationCoordinates && (
                                                    <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                                                        📍 GPS: {eq.locationCoordinates.coordinates}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => onSelect(eq)}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-sm font-semibold transition-colors"
                                            >
                                                Inspect
                                            </button>
                                            <button
                                                onClick={() => setExpandedItem(isExpanded ? null : eq.id)}
                                                className="px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                                            >
                                                {isExpanded ? "Less" : "Details"}
                                            </button>
                                        </div>

                                        {isExpanded && (
                                            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                                                <p className="text-xs"><span className="font-semibold">Serial:</span> {eq.serial}</p>
                                                {eq.metadata && Object.keys(eq.metadata).length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-semibold mb-1">Specifications:</p>
                                                        {Object.entries(eq.metadata).map(([key, value]) => (
                                                            <p key={key} className="text-xs text-gray-600 capitalize">{key}: {value}</p>
                                                        ))}
                                                    </div>
                                                )}
                                                {eq.photos?.equipment && (
                                                    <img src={eq.photos.equipment} alt="Equipment" className="mt-2 rounded-lg max-h-32 object-cover" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(eq => {
                            const config = EQ_TYPES[eq.type];
                            const isExpanded = expandedItem === eq.id;
                            return (
                                <div key={eq.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-4 flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                                            {config.emoji}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-gray-900">{eq.id}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${config.light}`}>
                          {config.short}
                        </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">{eq.area} · {eq.location}</p>
                                            <p className="text-xs text-gray-400">{eq.site} · {eq.dept}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onSelect(eq)}
                                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                                            >
                                                Inspect
                                            </button>
                                            <button
                                                onClick={() => setExpandedItem(isExpanded ? null : eq.id)}
                                                className="px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50"
                                            >
                                                {isExpanded ? "▲" : "▼"}
                                            </button>
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div><span className="text-gray-500">Serial:</span> {eq.serial}</div>
                                                {eq.locationCoordinates && (
                                                    <div><span className="text-gray-500">GPS:</span> {eq.locationCoordinates.coordinates}</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Footer user={user} />

            {showScanner && (
                <QRScanner
                    title="Scan Equipment QR"
                    hint="Point at the equipment's QR tag"
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    );
}