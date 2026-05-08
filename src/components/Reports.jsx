// src/components/Reports.jsx
import React, { useState, useRef } from 'react';
import TopNav from './TopNav';
import { EQ_TYPES, STATUS_STYLES } from '../constants/data';

export default function Reports({ inspections, user, onBack }) {
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [downloadFormat, setDownloadFormat] = useState("pdf");
    const [isDownloading, setIsDownloading] = useState(false);

    // Apply filters
    const filtered = [...inspections].reverse().filter(ins => {
        const typeMatch = typeFilter === "all" || ins.equipmentType === typeFilter;
        const statusMatch = statusFilter === "all" || ins.status === statusFilter;
        
        // Date range filter
        let dateMatch = true;
        if (dateRange.start) {
            const insDate = new Date(ins.ts).setHours(0,0,0,0);
            const startDate = new Date(dateRange.start).setHours(0,0,0,0);
            if (insDate < startDate) dateMatch = false;
        }
        if (dateRange.end && dateMatch) {
            const insDate = new Date(ins.ts).setHours(0,0,0,0);
            const endDate = new Date(dateRange.end).setHours(0,0,0,0);
            if (insDate > endDate) dateMatch = false;
        }
        
        return typeMatch && statusMatch && dateMatch;
    });

    const totals = {
        total: inspections.length,
        filtered: filtered.length,
        inspected: inspections.filter(i => i.status === "Inspected").length,
        action: inspections.filter(i => i.status === "Action Required").length,
        oos: inspections.filter(i => i.status === "Out of Service").length,
        filteredInspected: filtered.filter(i => i.status === "Inspected").length,
        filteredAction: filtered.filter(i => i.status === "Action Required").length,
        filteredOos: filtered.filter(i => i.status === "Out of Service").length
    };

    // Generate CSV data
    const generateCSV = () => {
        const headers = [
            "ID", "Equipment ID", "Equipment Type", "Status", "Area", "Site",
            "Inspector", "Date", "Time", "Passed Checks", "Failed Checks",
            "Comments", "Actions", "Scanned Condition", "QR Data", "GPS Location"
        ];
        
        const rows = filtered.map(ins => {
            const passed = Object.values(ins.checks || {}).filter(v => v === "yes").length;
            const failed = Object.values(ins.checks || {}).filter(v => v === "no").length;
            const date = new Date(ins.ts);
            
            return [
                ins.id,
                ins.equipmentId,
                ins.equipmentType,
                ins.status,
                ins.area || "",
                ins.site || "",
                ins.inspector || user?.name || "",
                date.toLocaleDateString("en-ZA"),
                date.toLocaleTimeString("en-ZA"),
                passed,
                failed,
                ins.comments || "",
                ins.actions || "",
                ins.scannedCondition || "",
                ins.qrData || "",
                ins.gpsLocation || ""
            ];
        });
        
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        ].join("\n");
        
        return csvContent;
    };

    // Generate JSON data
    const generateJSON = () => {
        const reportData = {
            generatedAt: new Date().toISOString(),
            generatedBy: user?.name || "Unknown",
            filters: {
                type: typeFilter,
                status: statusFilter,
                dateRange: dateRange
            },
            summary: {
                totalInspections: totals.total,
                filteredCount: totals.filtered,
                inspected: totals.filteredInspected,
                actionRequired: totals.filteredAction,
                outOfService: totals.filteredOos
            },
            inspections: filtered.map(ins => ({
                id: ins.id,
                equipmentId: ins.equipmentId,
                equipmentType: ins.equipmentType,
                status: ins.status,
                area: ins.area,
                site: ins.site,
                inspector: ins.inspector || user?.name,
                timestamp: ins.ts,
                date: new Date(ins.ts).toISOString(),
                checks: ins.checks || {},
                passedChecks: Object.values(ins.checks || {}).filter(v => v === "yes").length,
                failedChecks: Object.values(ins.checks || {}).filter(v => v === "no").length,
                comments: ins.comments,
                actions: ins.actions,
                scannedCondition: ins.scannedCondition,
                qrData: ins.qrData,
                gpsLocation: ins.gpsLocation,
                photos: ins.photos || []
            }))
        };
        
        return JSON.stringify(reportData, null, 2);
    };

    // Generate HTML for PDF
    const generateHTML = () => {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Inspection Report</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 40px;
                        color: #333;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #e53e3e;
                    }
                    .title {
                        font-size: 24px;
                        font-weight: bold;
                        color: #e53e3e;
                        margin-bottom: 10px;
                    }
                    .subtitle {
                        color: #666;
                        font-size: 12px;
                    }
                    .summary {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 15px;
                        margin-bottom: 30px;
                    }
                    .summary-card {
                        background: #f7fafc;
                        padding: 15px;
                        border-radius: 8px;
                        text-align: center;
                        border-left: 4px solid #e53e3e;
                    }
                    .summary-number {
                        font-size: 28px;
                        font-weight: bold;
                        color: #e53e3e;
                    }
                    .summary-label {
                        font-size: 12px;
                        color: #666;
                        margin-top: 5px;
                    }
                    .filters {
                        background: #f0f0f0;
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                        font-size: 12px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                        font-size: 11px;
                    }
                    th {
                        background-color: #e53e3e;
                        color: white;
                        font-weight: bold;
                    }
                    tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    .status-badge {
                        display: inline-block;
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-size: 10px;
                        font-weight: bold;
                    }
                    .status-Inspected { background: #c6f6d5; color: #22543d; }
                    .status-Action\\ Required { background: #feebc8; color: #7c2d12; }
                    .status-Out\\ of\\ Service { background: #fed7d7; color: #742a2a; }
                    .footer {
                        margin-top: 30px;
                        text-align: center;
                        font-size: 10px;
                        color: #999;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                    }
                    .page-break {
                        page-break-before: always;
                    }
                    .inspection-detail {
                        margin-bottom: 20px;
                        padding: 15px;
                        background: #fafafa;
                        border-radius: 8px;
                    }
                    .checks-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 5px;
                        margin-top: 10px;
                    }
                    .check-item {
                        font-size: 10px;
                        padding: 3px;
                    }
                    .check-pass { color: #38a169; }
                    .check-fail { color: #e53e3e; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">Equipment Inspection Report</div>
                    <div class="subtitle">Generated on ${new Date().toLocaleString()} by ${user?.name || "System"}</div>
                </div>
                
                <div class="summary">
                    <div class="summary-card">
                        <div class="summary-number">${totals.filtered}</div>
                        <div class="summary-label">Total Inspections</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-number">${totals.filteredInspected}</div>
                        <div class="summary-label">Passed</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-number">${totals.filteredAction}</div>
                        <div class="summary-label">Action Required</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-number">${totals.filteredOos}</div>
                        <div class="summary-label">Out of Service</div>
                    </div>
                </div>
                
                <div class="filters">
                    <strong>Applied Filters:</strong><br/>
                    Equipment Type: ${typeFilter === "all" ? "All" : typeFilter}<br/>
                    Status: ${statusFilter === "all" ? "All" : statusFilter}<br/>
                    Date Range: ${dateRange.start || "Any"} to ${dateRange.end || "Any"}
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Equipment ID</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Area</th>
                            <th>Inspector</th>
                            <th>Passed</th>
                            <th>Failed</th>
                            <th>Comments</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(ins => {
                            const passed = Object.values(ins.checks || {}).filter(v => v === "yes").length;
                            const failed = Object.values(ins.checks || {}).filter(v => v === "no").length;
                            return `
                                <tr>
                                    <td>${new Date(ins.ts).toLocaleDateString()}</td>
                                    <td>${ins.equipmentId}</td>
                                    <td>${ins.equipmentType}</td>
                                    <td><span class="status-badge status-${ins.status.replace(/ /g, '\\ ')}">${ins.status}</span></td>
                                    <td>${ins.area || ""}</td>
                                    <td>${ins.inspector || user?.name || ""}</td>
                                    <td>${passed}</td>
                                    <td>${failed}</td>
                                    <td>${ins.comments?.substring(0, 50) || ""}</td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
                
                ${filtered.length > 10 ? `<div class="page-break"></div>` : ""}
                
                <div class="footer">
                    <p>This report was automatically generated by the Inspection Management System.</p>
                    <p>For any queries, please contact the maintenance department.</p>
                </div>
            </body>
            </html>
        `;
    };

    // Download handlers
    const downloadCSV = () => {
        const csv = generateCSV();
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute("download", `inspection_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const downloadJSON = () => {
        const json = generateJSON();
        const blob = new Blob([json], { type: "application/json" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute("download", `inspection_report_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const downloadPDF = async () => {
        setIsDownloading(true);
        try {
            // Dynamically import html2pdf.js
            const html2pdf = (await import('html2pdf.js')).default;
            
            const html = generateHTML();
            const element = document.createElement('div');
            element.innerHTML = html;
            document.body.appendChild(element);
            
            const opt = {
                margin: [0.5, 0.5, 0.5, 0.5],
                filename: `inspection_report_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, letterRendering: true },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };
            
            await html2pdf().set(opt).from(element).save();
            document.body.removeChild(element);
        } catch (error) {
            console.error("PDF generation error:", error);
            alert("Failed to generate PDF. Please try CSV or JSON format instead.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownload = () => {
        switch(downloadFormat) {
            case 'csv':
                downloadCSV();
                break;
            case 'json':
                downloadJSON();
                break;
            case 'pdf':
                downloadPDF();
                break;
            default:
                downloadCSV();
        }
    };

    const printReport = () => {
        const printWindow = window.open('', '_blank');
        const html = generateHTML();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    };

    const clearFilters = () => {
        setTypeFilter("all");
        setStatusFilter("all");
        setDateRange({ start: "", end: "" });
    };

    const stats = [
        { label: "Total", value: totals.filtered, color: "bg-gray-800" },
        { label: "OK", value: totals.filteredInspected, color: "bg-green-600" },
        { label: "Action", value: totals.filteredAction, color: "bg-orange-500" },
        { label: "OOS", value: totals.filteredOos, color: "bg-red-700" }
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            <TopNav
                title="Inspection Reports"
                subtitle={`${filtered.length} records`}
                onBack={onBack}
            />

            <div className="max-w-2xl mx-auto p-4 space-y-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-2">
                    {stats.map(({ label, value, color }) => (
                        <div key={label} className={`${color} text-white rounded-2xl p-3 text-center shadow-md transition-all hover:scale-105`}>
                            <div className="text-2xl font-bold">{value}</div>
                            <div className="text-xs opacity-75">{label}</div>
                        </div>
                    ))}
                </div>

                {/* Download Controls */}
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex gap-2">
                            <select
                                value={downloadFormat}
                                onChange={(e) => setDownloadFormat(e.target.value)}
                                className="px-3 py-2 rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                            >
                                <option value="csv">CSV Format</option>
                                <option value="json">JSON Format</option>
                                <option value="pdf">PDF Format</option>
                            </select>
                            <button
                                onClick={handleDownload}
                                disabled={isDownloading || filtered.length === 0}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all transform hover:scale-105 flex items-center gap-2 ${
                                    isDownloading || filtered.length === 0
                                        ? "bg-gray-300 cursor-not-allowed"
                                        : "bg-red-600 hover:bg-red-700 text-white"
                                }`}
                            >
                                {isDownloading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        📥 Download {downloadFormat.toUpperCase()}
                                    </>
                                )}
                            </button>
                            <button
                                onClick={printReport}
                                disabled={filtered.length === 0}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all transform hover:scale-105 flex items-center gap-2 ${
                                    filtered.length === 0
                                        ? "bg-gray-300 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                }`}
                            >
                                🖨️ Print
                            </button>
                        </div>
                        <button
                            onClick={clearFilters}
                            className="text-xs text-gray-500 hover:text-gray-700"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Status Filter */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {["all", "Inspected", "Action Required", "Out of Service"].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                                statusFilter === status
                                    ? "bg-red-600 text-white border-red-600"
                                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                            }`}
                        >
                            {status === "all" ? "All Status" : status}
                        </button>
                    ))}
                </div>

                {/* Type Filter */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {["all", ...Object.keys(EQ_TYPES)].map(type => (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(type)}
                            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                                typeFilter === type
                                    ? "bg-blue-700 text-white border-blue-700"
                                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                            }`}
                        >
                            {type === "all" ? "All Types" : `${EQ_TYPES[type].emoji} ${EQ_TYPES[type].short}`}
                        </button>
                    ))}
                </div>

                {/* Date Range Filter */}
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                    <button
                        onClick={() => setShowDateFilter(!showDateFilter)}
                        className="w-full flex items-center justify-between text-sm font-semibold text-gray-700"
                    >
                        <span>📅 Date Range Filter</span>
                        <span>{showDateFilter ? "▼" : "▶"}</span>
                    </button>
                    {showDateFilter && (
                        <div className="mt-3 space-y-2">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500">From:</label>
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500">To:</label>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                                    />
                                </div>
                            </div>
                            {(dateRange.start || dateRange.end) && (
                                <button
                                    onClick={() => setDateRange({ start: "", end: "" })}
                                    className="text-xs text-red-600 hover:text-red-700"
                                >
                                    Clear dates
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Inspection List */}
                {filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <p className="text-5xl mb-3">📋</p>
                        <p className="text-sm font-medium">
                            {inspections.length === 0 ? "No inspections yet" : "No records match filter"}
                        </p>
                        <p className="text-xs mt-1">
                            {inspections.length === 0
                                ? "Complete an inspection to see reports"
                                : "Try adjusting the filters"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(ins => {
                            const config = EQ_TYPES[ins.equipmentType];
                            const passed = Object.values(ins.checks || {}).filter(v => v === "yes").length;
                            const failed = Object.values(ins.checks || {}).filter(v => v === "no").length;
                            return (
                                <div key={ins.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-all hover:shadow-md">
                                    <div className="flex items-start gap-3 mb-3">
                                        <span className="text-2xl">{config?.emoji}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                <span className="font-bold text-gray-900 text-sm">{ins.equipmentId}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${STATUS_STYLES[ins.status]}`}>
                                                    {ins.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 truncate">
                                                {ins.area} · {ins.site} · {ins.inspector}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(ins.ts).toLocaleString("en-ZA")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 text-xs mb-2">
                                        <span className="text-green-600 font-semibold">✅ {passed} passed</span>
                                        {failed > 0 && <span className="text-red-600 font-semibold">❌ {failed} failed</span>}
                                    </div>

                                    {ins.comments && (
                                        <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 mb-1">{ins.comments}</p>
                                    )}
                                    {ins.actions && (
                                        <p className="text-xs text-orange-700 bg-orange-50 rounded-lg p-2 mb-1">⚠️ {ins.actions}</p>
                                    )}
                                    {ins.scannedCondition && (
                                        <p className="text-xs text-blue-700 bg-blue-50 rounded-lg p-2">📱 Condition scan: {ins.scannedCondition}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
                <div className="h-4" />
            </div>
        </div>
    );
}