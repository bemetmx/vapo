
import React, { useState } from 'react';
import { Severity, Status, Incident } from '../types';
import { DEPARTMENTS } from '../constants';
import { analyzeIncident } from '../services/geminiService';

interface IncidentFormProps {
  onAdd: (incident: Incident) => void;
  onCancel: () => void;
}

export const IncidentForm: React.FC<IncidentFormProps> = ({ onAdd, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    equipmentName: '',
    model: '',
    serialNumber: '',
    department: DEPARTMENTS[0],
    severity: Severity.LOW,
    description: '',
    reportedBy: 'Juan Pérez (Bio-Ingeniero)'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // AI Analysis
    const analysis = await analyzeIncident(formData.description, formData.equipmentName);

    const newIncident: Incident = {
      ...formData,
      id: Date.now().toString(),
      status: Status.PENDIENTE,
      date: new Date().toISOString(),
      aiAnalysis: analysis
    } as Incident;

    onAdd(newIncident);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-indigo-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white">Registrar Nueva Incidencia</h2>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700">Nombre del Equipo</label>
            <input 
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={formData.equipmentName}
              onChange={(e) => setFormData({...formData, equipmentName: e.target.value})}
              placeholder="Ej: Ventilador Mecánico"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700">Modelo</label>
            <input 
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={formData.model}
              onChange={(e) => setFormData({...formData, model: e.target.value})}
              placeholder="Ej: Puritan Bennett 980"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700">S/N (Número de Serie)</label>
            <input 
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={formData.serialNumber}
              onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
              placeholder="SN-XXXXX"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700">Departamento</label>
            <select 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all"
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
            >
              {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-slate-700">Gravedad Inicial</label>
            <select 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all"
              value={formData.severity}
              onChange={(e) => setFormData({...formData, severity: e.target.value as Severity})}
            >
              <option value={Severity.LOW}>Baja (Mantenimiento preventivo)</option>
              <option value={Severity.MEDIUM}>Media (Falla parcial)</option>
              <option value={Severity.HIGH}>Alta (Equipo inoperativo)</option>
              <option value={Severity.CRITICAL}>Crítica (Riesgo vital)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-semibold text-slate-700">Descripción del Problema</label>
          <textarea 
            required
            rows={4}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Describa detalladamente qué falló y en qué circunstancias..."
          />
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Analizando con IA...
              </>
            ) : 'Registrar Incidencia'}
          </button>
        </div>
      </form>
    </div>
  );
};
