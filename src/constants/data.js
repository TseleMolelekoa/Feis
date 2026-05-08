// src/constants/data.js (Updated with new equipment types)
export const SITES = ["Parsons", "Bruce", "King", "Load Out"];

export const DEPARTMENTS = [
    "Admin",
    "Mining",
    "Operations",
    "Maintenance",
    "Logistics",
    "Safety",
    "Control",
    "Processing"
];

export const AREAS = [
    "Admin Building",
    "Processing Plant",
    "Crusher Area",
    "Workshop",
    "Warehouse",
    "Mine Shaft",
    "Control Room",
    "Loading Zone",
    "Parking Area",
    "Reception"
];

export const EQ_TYPES = {
    fire_extinguisher: {
        label: "Fire Extinguisher",
        short: "Fire Ext.",
        emoji: "🧯",
        color: "bg-red-600",
        light: "bg-red-50 text-red-700 border-red-200",
        fields: {
            serial: { label: "Serial Number", type: "text", required: true },
            capacity: { label: "Capacity", type: "select", options: ["1kg", "2kg", "4kg", "6kg", "9kg", "12kg"] },
            type: { label: "Extinguisher Type", type: "select", options: ["DCP", "CO2", "Foam", "Water"] }
        },
        checks: [
            "Visibility",
            "Accessibility",
            "Signage in place",
            "Bracket intact",
            "Carry handle intact",
            "Safety pin intact and sealed",
            "Pressure gauge in the green",
            "Discharge hose not cracked",
            "Information sticker available",
            "Inspect condition of fire extinguisher",
            "Service provider sticker available",
            "Monthly inspection sticker"
        ],
        extras: ["expiryDate", "actions", "status"]
    },
    fire_hydrant: {
        label: "Fire Hydrant",
        short: "Hydrant",
        emoji: "🚒",
        color: "bg-orange-600",
        light: "bg-orange-50 text-orange-700 border-orange-200",
        fields: {
            serial: { label: "Serial Number", type: "text", required: true },
            size: { label: "Size", type: "select", options: ["65mm", "100mm"] }
        },
        checks: [
            "Any leaks visible",
            "Paul Assembly intact",
            "Lip seal intact",
            "Hydrant Barrier not damaged",
            "Accessibility",
            "Visibility",
            "Signage in place",
            "Signage and Fire hydrant clean"
        ],
        extras: ["actions", "status"]
    },
    fire_hose_reel: {
        label: "Fire Hose Reel",
        short: "Hose Reel",
        emoji: "🔄",
        color: "bg-yellow-600",
        light: "bg-yellow-50 text-yellow-700 border-yellow-200",
        fields: {
            serial: { label: "Serial Number", type: "text", required: true },
            length: { label: "Hose Length", type: "select", options: ["30m", "45m", "60m"] }
        },
        checks: [
            "Hose reel drum intact",
            "Hose intact",
            "Nozzle intact",
            "Seal not broken",
            "Valve complete",
            "Accessibility",
            "Visibility",
            "Signage in place",
            "Signage and Hose Reel clean"
        ],
        extras: ["actions", "status"]
    },
    hydrant_box: {
        label: "Fire Extinguisher / Hydrant Box",
        short: "Hydrant Box",
        emoji: "📦",
        color: "bg-blue-600",
        light: "bg-blue-50 text-blue-700 border-blue-200",
        fields: {
            serial: { label: "Serial Number", type: "text", required: true }
        },
        checks: [
            "Box intact and locked",
            "Key available",
            "Key box glass intact",
            "2 x 65 mm x 30 m lay flat hose",
            "1 x Branch",
            "1 x T-spanner",
            "Accessibility",
            "Visibility",
            "Signage in place",
            "Signage and Fire hose box clean"
        ],
        extras: ["actions", "status"]
    },
    fire_deluge: {
        label: "Fire Deluge System",
        short: "Deluge",
        emoji: "💧",
        color: "bg-purple-600",
        light: "bg-purple-50 text-purple-700 border-purple-200",
        fields: {
            serial: { label: "Serial Number", type: "text", required: true },
            pressure: { label: "Pressure Rating", type: "text", placeholder: "e.g., 7-10 Bar" }
        },
        checks: [
            "Any leaks visible",
            "Pressure Gauge @ 7 to 10 Bar",
            "Main Valve open",
            "Main Valve closed",
            "Lockout available",
            "Accessibility",
            "Visibility",
            "Signage in place",
            "Signage and Fire system unit clean"
        ],
        extras: ["actions", "status"]
    },
    first_aid_box: {
        label: "First-Aid Box",
        short: "First Aid",
        emoji: "🩺",
        color: "bg-green-600",
        light: "bg-green-50 text-green-700 border-green-200",
        fields: {
            serial: { label: "Serial Number", type: "text", required: true },
            type: { label: "Box Type", type: "select", options: ["Standard", "Industrial", "Vehicle"] }
        },
        checks: [
            "Seal intact",
            "Expiry dates",
            "Monthly check",
            "First Aider details",
            "Accessibility",
            "Visibility",
            "Signage in place",
            "Signage and First-Aid box clean"
        ],
        extras: ["actions", "status"]
    }
};

export const USERS = [
    { id: 1, username: "admin", password: "admin123", role: "admin", name: "Admin User", site: "All Sites", avatar: "AU" },
    { id: 2, username: "miner1", password: "miner123", role: "miner", name: "John Miner", site: "Parsons", avatar: "JM" },
    { id: 3, username: "super1", password: "super123", role: "supervisor", name: "Sarah Supervisor", site: "Bruce", avatar: "SS" },
    { id: 4, username: "insp1", password: "insp123", role: "inspector", name: "Mike Inspector", site: "King", avatar: "MI" }
];

export const EQUIPMENT = [
    { id: "KM/SE094", type: "fire_extinguisher", area: "Admin Building", location: "Parking Area", site: "Parsons", dept: "Admin", serial: "9kg DCP", metadata: { capacity: "9kg", extinguisherType: "DCP" } },
    { id: "KM/SE095", type: "fire_extinguisher", area: "Admin Building", location: "Reception", site: "Parsons", dept: "Admin", serial: "9kg DCP", metadata: { capacity: "9kg", extinguisherType: "DCP" } },
    { id: "KM/SE096", type: "fire_extinguisher", area: "Workshop", location: "Tool Room", site: "King", dept: "Maintenance", serial: "9kg DCP", metadata: { capacity: "9kg", extinguisherType: "DCP" } },
    { id: "KM/HY001", type: "fire_hydrant", area: "Processing Plant", location: "Main Gate", site: "Bruce", dept: "Operations", serial: "HY-65mm", metadata: { size: "65mm" } },
    { id: "KM/HY002", type: "fire_hydrant", area: "Crusher Area", location: "North Side", site: "Parsons", dept: "Mining", serial: "HY-65mm", metadata: { size: "65mm" } },
    { id: "KM/HR001", type: "fire_hose_reel", area: "Warehouse", location: "Bay 1", site: "King", dept: "Logistics", serial: "HR-30m", metadata: { length: "30m" } },
    { id: "KM/HR002", type: "fire_hose_reel", area: "Mine Shaft", location: "Level 3", site: "Bruce", dept: "Mining", serial: "HR-30m", metadata: { length: "30m" } },
    { id: "KM/HB001", type: "hydrant_box", area: "Control Room", location: "Level 2", site: "Load Out", dept: "Control", serial: "HB-65mm", metadata: {} },
    { id: "KM/FD001", type: "fire_deluge", area: "Crusher Area", location: "Zone A", site: "Parsons", dept: "Mining", serial: "FD-100", metadata: { pressure: "7-10 Bar" } },
    { id: "KM/FA001", type: "first_aid_box", area: "Mine Shaft", location: "Level 5", site: "Bruce", dept: "Safety", serial: "FAB-STD", metadata: { boxType: "Standard" } },
    { id: "KM/FA002", type: "first_aid_box", area: "Admin Building", location: "HR Office", site: "Parsons", dept: "Admin", serial: "FAB-STD", metadata: { boxType: "Standard" } }
];

export const ROLE_COLORS = {
    admin: "bg-gray-800",
    supervisor: "bg-blue-700",
    inspector: "bg-orange-600",
    miner: "bg-yellow-600"
};

export const STATUS_STYLES = {
    "Inspected": "bg-green-100 text-green-800 border-green-300",
    "Action Required": "bg-orange-100 text-orange-800 border-orange-300",
    "Out of Service": "bg-red-100 text-red-800 border-red-300"
};