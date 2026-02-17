
import React from 'react';
import { Incident, Severity, Status } from '../types';
import { SEVERITY_COLORS, STATUS_COLORS } from '../constants';

interface IncidentCardProps {
  incident: Incident;
  onUpdateStatus: (id: string, status: Status) => void;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onUpdateStatus }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[incident.severity]}`}>
              {incident.severity}
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-2">{incident.equipmentName}</h3>
            <p className="text-sm text-slate-500">{incident.model} • <span className="font-mono">{incident.serialNumber}</span></p>
          </div>
          <div className="flex flex-col items-end">
             <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${STATUS_COLORS[incident.status]}`}>
              {incident.status.replace('_', ' ')}
            </span>
            <span className="text-[10px] text-slate-400 mt-1">
              {new Date(incident.date).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-4">
          <p className="text-sm text-slate-700 leading-relaxed italic">
            "{incident.description}"
          </p>
        </div>

        {incident.aiAnalysis && (
          <div className="mb-4 border-l-4 border-indigo-500 pl-4 py-1">
            <h4 className="text-xs font-bold text-indigo-600 uppercase mb-2 flex items-center">
              <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.464 15.05a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 14a1 1 0 11-2 0 1 1 0 012 0z"></path></svg>
              Análisis AI (Urge: {incident.aiAnalysis.urgencyScore}/10)
            </h4>
            <p className="text-xs text-slate-600 font-medium">Riesgo: <span className="text-slate-900 font-normal">{incident.aiAnalysis.riskAssessment}</span></p>
            <p className="text-xs text-slate-600 font-medium mt-1">Acción: <span className="text-slate-900 font-normal">{incident.aiAnalysis.suggestedAction}</span></p>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-400">Dpto: <span className="font-semibold text-slate-600">{incident.department}</span></span>
          <div className="flex space-x-2">
            {incident.status !== Status.RESUELTO && (
              <button 
                onClick={() => onUpdateStatus(incident.id, Status.RESUELTO)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Marcar Resuelto
              </button>
            )}
            {incident.status === Status.PENDIENTE && (
              <button 
                onClick={() => onUpdateStatus(incident.id, Status.EN_PROGRESO)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Atender
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
