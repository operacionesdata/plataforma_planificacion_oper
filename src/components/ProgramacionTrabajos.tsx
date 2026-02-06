import React, { useState } from "react";
import { GanttCalendar } from "./GanttCalendar";
import { GanttCalendarFondeo } from "./GanttCalendarFondeo";
import { GanttCalendarRental } from "./GanttCalendarRental";
import { GanttCalendarHabitabilidad } from "./GanttCalendarHabitabilidad";
import { GanttCalendarSSO } from "./GanttCalendarSSO";
import { GanttCalendarIngenieria } from "./GanttCalendarIngenieria";

interface SubTabProps {
  id: string;
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}

const SubTab: React.FC<SubTabProps> = ({ label, icon, active, onClick }) => (
  <button
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
      active
        ? "bg-primary text-primary-foreground shadow-md"
        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
    }`}
    onClick={onClick}
  >
    <span>{icon}</span>
    {label}
  </button>
);

const ProgramacionTrabajos: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState("redes");

  const subTabs = [
    { id: "redes", label: "Programación Redes", icon: "📅" },
    { id: "fondeo", label: "Programación Fondeo", icon: "⚓" },
    { id: "rental", label: "Programación Rental", icon: "🔧" },
    { id: "habitabilidad", label: "Habitabilidad", icon: "🏠" },
    { id: "sso", label: "Área SSO", icon: "🦺" },
    { id: "ingenieria", label: "Ingeniería", icon: "🔬" },
  ];

  const renderActiveSubTab = () => {
    const key = `subtab-${activeSubTab}-${Date.now()}`;
    
    switch (activeSubTab) {
      case "redes":
        return <GanttCalendar key={key} />;
      case "fondeo":
        return <GanttCalendarFondeo key={key} />;
      case "rental":
        return <GanttCalendarRental key={key} />;
      case "habitabilidad":
        return <GanttCalendarHabitabilidad key={key} />;
      case "sso":
        return <GanttCalendarSSO key={key} />;
      case "ingenieria":
        return <GanttCalendarIngenieria key={key} />;
      default:
        return <GanttCalendar key={key} />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="ocean-card p-4">
        <h2 className="text-xl font-bold text-primary mb-4">Programación de Trabajos</h2>
        <div className="flex flex-wrap gap-2">
          {subTabs.map((tab) => (
            <SubTab
              key={tab.id}
              id={tab.id}
              label={tab.label}
              icon={tab.icon}
              active={activeSubTab === tab.id}
              onClick={() => setActiveSubTab(tab.id)}
            />
          ))}
        </div>
      </div>
      
      <div className="transition-all duration-300">
        {renderActiveSubTab()}
      </div>
    </div>
  );
};

export default ProgramacionTrabajos;
