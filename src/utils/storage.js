// src/utils/storage.js (Updated with equipment storage)
export const STORAGE_KEY = 'feis_inspections';
export const EQUIPMENT_STORAGE_KEY = 'feis_equipment';

export const loadInspections = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Failed to load inspections:', error);
        return [];
    }
};

export const saveInspections = (inspections) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(inspections));
    } catch (error) {
        console.error('Failed to save inspections:', error);
    }
};

export const clearInspections = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to clear inspections:', error);
    }
};

export const loadEquipment = () => {
    try {
        const saved = localStorage.getItem(EQUIPMENT_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Failed to load equipment:', error);
        return [];
    }
};

export const saveEquipment = (equipment) => {
    try {
        localStorage.setItem(EQUIPMENT_STORAGE_KEY, JSON.stringify(equipment));
    } catch (error) {
        console.error('Failed to save equipment:', error);
    }
};

export const exportInspections = () => {
    const inspections = loadInspections();
    const dataStr = JSON.stringify(inspections, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `feis_inspections_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
};

export const exportEquipment = () => {
    const equipment = loadEquipment();
    const dataStr = JSON.stringify(equipment, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `feis_equipment_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
};