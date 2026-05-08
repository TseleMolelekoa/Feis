// src/App.js
// Remove unused imports
import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import EquipmentList from './components/EquipmentList';
import InspectionForm from './components/InspectionForm';
import Reports from './components/Reports';
import AddEquipment from './components/AddEquipment';
import { loadInspections, saveInspections, loadEquipment, saveEquipment } from './utils/storage';
import { EQUIPMENT as INITIAL_EQUIPMENT } from './constants/data'; // Only import what you need

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [initialType, setInitialType] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [equipment, setEquipment] = useState([]);

  useEffect(() => {
    const savedInspections = loadInspections();
    if (savedInspections.length > 0) {
      setInspections(savedInspections);
    }

    const savedEquipment = loadEquipment();
    if (savedEquipment.length > 0) {
      setEquipment(savedEquipment);
    } else {
      setEquipment(INITIAL_EQUIPMENT);
    }
  }, []);

  useEffect(() => {
    if (inspections.length > 0) {
      saveInspections(inspections);
    }
  }, [inspections]);

  useEffect(() => {
    if (equipment.length > 0) {
      saveEquipment(equipment);
    }
  }, [equipment]);

  const handleNavigation = (action) => {
    if (action === 'reports') {
      setView('reports');
      return;
    }
    if (action === 'equipment') {
      setInitialType(null);
      setView('equipment');
      return;
    }
    if (action === 'addEquipment') {
      setView('addEquipment');
      return;
    }
    if (action.startsWith('type:')) {
      setInitialType(action.slice(5));
      setView('equipment');
      return;
    }
    setView('dashboard');
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setView('login');
  };

  const handleSubmitInspection = (inspection) => {
    setInspections(prev => [...prev, inspection]);
    setView('dashboard');
    setSelectedEquipment(null);
  };

  const handleAddEquipment = (newEquipment) => {
    setEquipment(prev => [...prev, newEquipment]);
    setView('dashboard');
  };

  if (!user || view === 'login') {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (view === 'reports') {
    return (
        <Reports
            inspections={inspections}
            user={user}
            onBack={() => setView('dashboard')}
        />
    );
  }

  if (view === 'equipment') {
    return (
        <EquipmentList
            user={user}
            equipment={equipment}
            initialType={initialType}
            onSelect={(eq) => {
              setSelectedEquipment(eq);
              setView('inspection');
            }}
            onBack={() => setView('dashboard')}
        />
    );
  }

  if (view === 'addEquipment') {
    return (
        <AddEquipment
            user={user}
            onAdd={handleAddEquipment}
            onBack={() => setView('dashboard')}
        />
    );
  }

  if (view === 'inspection' && selectedEquipment) {
    return (
        <InspectionForm
            equipment={selectedEquipment}
            user={user}
            onSubmit={handleSubmitInspection}
            onBack={() => setView('equipment')}
        />
    );
  }

  return (
      <Dashboard
          user={user}
          inspections={inspections}
          equipment={equipment}
          onNavigate={handleNavigation}
          onLogout={handleLogout}
      />
  );
}