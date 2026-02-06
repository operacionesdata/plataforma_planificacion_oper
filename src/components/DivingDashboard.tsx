// @ts-nocheck
import React, { useState } from "react";
import FlotaMap from "./FlotaMap";
import FlotaRedesMap from "./FlotaRedesMap";
import { LISProgramacion } from "./ProgramarLIS";
import { RedesProgramacion } from "./ProgramarRedes";
import { ResumenInforme } from "./ResumenInforme";
import { ResumenTab } from "./ResumenTab";
import ProgramacionTrabajos from "./ProgramacionTrabajos";
import IngresoDatos from "./IngresoDatos";
import { DEFAULT_CENTRO_NAMES, DEFAULT_CENTRO_IDS } from "@/constants/centros";

// ==================== INTERFACES ====================

interface TabProps {
  id: string;
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}

// ==================== COMPONENTES ====================

const Tab: React.FC<TabProps> = ({ label, icon, active, onClick }) => (
  <button className={`tab-button ${active ? "active" : ""}`} onClick={onClick}>
    <span>{icon}</span>
    {label}
  </button>
);

// ==================== COMPONENTE PRINCIPAL DASHBOARD ====================

const DivingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("resumen");
  const [selectedCentroId, setSelectedCentroId] = useState<number>(DEFAULT_CENTRO_IDS[0]);
  const [forceReload, setForceReload] = useState<number>(0);
  const [lisProgramaciones, setLisProgramaciones] = useState<LISProgramacion[]>([]);
  const [redesProgramaciones, setRedesProgramaciones] = useState<RedesProgramacion[]>([]);

  const tabs = [
    { id: "resumen", label: "Resumen", icon: "📊" },
    { id: "informeResumen", label: "Informe", icon: "📄" },
    { id: "ingresoDatos", label: "Ingreso Datos", icon: "✏️" },
    { id: "programacionTrabajos", label: "Programación de Trabajos", icon: "📋" },
    { id: "flota", label: "Flota LIS", icon: "🚢" },
    { id: "flotaRedes", label: "Gantt Barcos", icon: "🔶" },
  ];

  const handleCentroChange = (newCentroId: number) => {
    console.log("🔄 DivingDashboard - Cambiando centro a:", newCentroId, DEFAULT_CENTRO_NAMES[newCentroId]);
    setSelectedCentroId(newCentroId);
    setForceReload((prev) => prev + 1);
  };

  const handleLisProgramacionChange = (programaciones: LISProgramacion[]) => {
    setLisProgramaciones(programaciones);
  };

  const handleRedesProgramacionChange = (programaciones: RedesProgramacion[]) => {
    setRedesProgramaciones(programaciones);
  };

  const renderActiveTab = () => {
    const key = `${activeTab}-${selectedCentroId}-${forceReload}`;

    switch (activeTab) {
      case "resumen":
        return (
          <ResumenTab
            key={key}
            selectedCentroId={selectedCentroId}
            onCentroChange={handleCentroChange}
            forceReload={forceReload}
          />
        );
      case "informeResumen":
        return <ResumenInforme key={key} />;
      case "ingresoDatos":
        return <IngresoDatos key={key} />;
      case "programacionTrabajos":
        return <ProgramacionTrabajos key={key} />;
      case "flota":
        return <FlotaMap key={key} lisProgramaciones={lisProgramaciones} onProgramacionChange={handleLisProgramacionChange} />;
      case "flotaRedes":
        return <FlotaRedesMap key={key} redesProgramaciones={redesProgramaciones} onProgramacionChange={handleRedesProgramacionChange} />;
      default:
        return (
          <ResumenTab
            key={key}
            selectedCentroId={selectedCentroId}
            onCentroChange={handleCentroChange}
            forceReload={forceReload}
          />
        );
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2 border-2 border-white/30 rounded-lg px-4 py-2 bg-black/20">
            Sistema de Gestión Operaciones
          </h1>
          <p className="text-muted-foreground">Monitoreo integral de operaciones submarinas</p>
        </header>

        <div className="flex flex-wrap gap-4 mb-8 p-2 ocean-card">
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              id={tab.id}
              label={tab.label}
              icon={tab.icon}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        <main className="transition-all duration-300">{renderActiveTab()}</main>
      </div>
    </div>
  );
};

export default DivingDashboard;
