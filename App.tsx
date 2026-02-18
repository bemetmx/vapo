
import React, { useState, useEffect, useRef } from 'react';
import { CalibrationReport, CalibrationPoint, TolerancePoint, Incident, Status, Severity, Stats } from './types';
import { NOMINAL_VALUES, TOLERANCE_RANGES, INITIAL_MEASUREMENTS, VAPORIZER_MODELS } from './constants';
import { generateCalibrationObservations } from './services/geminiService';
import { Layout } from './components/Layout';
import { IncidentForm } from './components/IncidentForm';
import { IncidentCard } from './components/IncidentCard';
import { StatsCards } from './components/StatsCards';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calibration' | 'incidents' | 'history'>('calibration');
  const [isCustomModel, setIsCustomModel] = useState(false);
  
  // State for the active report being edited
  const [report, setReport] = useState<CalibrationReport>({
    id: Date.now().toString(),
    clientName: '',
    equipmentData: { brand: '', model: VAPORIZER_MODELS[0].name, serial: '', agent: 'Sevoflurano' },
    standardEquipment: '',
    testFlow: VAPORIZER_MODELS[0].defaultFlow, 
    envConditions: { temp: 20, humidity: 50, pressure: 1013 },
    date: new Date().toISOString().split('T')[0],
    measurements: INITIAL_MEASUREMENTS,
    tolerances: [],
    observations: ''
  });

  const [savedReports, setSavedReports] = useState<CalibrationReport[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const errorChartRef = useRef<any>(null);
  const toleranceChartRef = useRef<any>(null);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [showIncidentForm, setShowIncidentForm] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const localReports = localStorage.getItem('bemet_calibration_history');
    if (localReports) {
      try {
        setSavedReports(JSON.parse(localReports));
      } catch (e) {
        console.error("Error loading history", e);
      }
    }

    const localIncidents = localStorage.getItem('bemet_incidents');
    if (localIncidents) {
      try {
        setIncidents(JSON.parse(localIncidents));
      } catch (e) {
        console.error("Error loading incidents", e);
      }
    }
  }, []);

  // Save incidents to localStorage when they change
  useEffect(() => {
    localStorage.setItem('bemet_incidents', JSON.stringify(incidents));
  }, [incidents]);

  // Calibration Logic: Auto-calculate measurements and tolerances
  useEffect(() => {
    const updatedMeasurements = report.measurements.map(p => {
      const vals = [p.m1, p.m2, p.m3];
      const avg = vals.reduce((a, b) => a + b, 0) / 3;
      const error = avg - p.nominal;
      const stdDev = Math.sqrt(vals.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / 3);
      return { 
        ...p, 
        average: Number(avg.toFixed(3)), 
        error: Number(error.toFixed(3)), 
        stdDev: Number(stdDev.toFixed(3)) 
      };
    });

    const updatedTolerances = updatedMeasurements.map(p => {
      const range = (TOLERANCE_RANGES as any)[p.nominal];
      return {
        nominal: p.nominal,
        min: range.min,
        max: range.max,
        average: p.average,
        isCompliant: p.average >= range.min && p.average <= range.max
      };
    });

    setReport(prev => ({ ...prev, measurements: updatedMeasurements, tolerances: updatedTolerances }));
  }, [JSON.stringify(report.measurements.map(m => [m.m1, m.m2, m.m3, m.mReceived]))]);

  useEffect(() => {
    if (activeTab === 'calibration') {
      updateCharts();
    }
  }, [report.measurements, activeTab]);

  const updateCharts = () => {
    const errorCtx = document.getElementById('errorChart') as HTMLCanvasElement;
    const toleranceCtx = document.getElementById('toleranceChart') as HTMLCanvasElement;

    if (!errorCtx || !toleranceCtx) return;

    if (errorChartRef.current) errorChartRef.current.destroy();
    if (toleranceChartRef.current) toleranceChartRef.current.destroy();

    errorChartRef.current = new (window as any).Chart(errorCtx, {
      type: 'line',
      data: {
        labels: NOMINAL_VALUES.map(v => `${v}%`),
        datasets: [
          {
            label: 'Error de Medida (%)',
            data: report.measurements.map(m => m.error),
            borderColor: '#ee7d31',
            backgroundColor: 'rgba(238, 125, 49, 0.1)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });

    toleranceChartRef.current = new (window as any).Chart(toleranceCtx, {
      type: 'line',
      data: {
        labels: NOMINAL_VALUES.map(v => `${v}%`),
        datasets: [
          { label: 'Promedio Registrado', data: report.tolerances.map(t => t.average), borderColor: '#10b981', pointRadius: 5 },
          { label: 'Límite Inferior', data: report.tolerances.map(t => t.min), borderColor: '#ef4444', borderDash: [5, 5], fill: false, pointRadius: 0 },
          { label: 'Límite Superior', data: report.tolerances.map(t => t.max), borderColor: '#ef4444', borderDash: [5, 5], fill: false, pointRadius: 0 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  };

  const handleModelChange = (modelName: string) => {
    if (modelName === "CUSTOM") {
      setIsCustomModel(true);
      setReport({
        ...report,
        equipmentData: { ...report.equipmentData, model: '' }
      });
      return;
    }

    const modelData = VAPORIZER_MODELS.find(m => m.name === modelName);
    setIsCustomModel(false);
    if (modelData) {
      setReport({
        ...report,
        equipmentData: { ...report.equipmentData, model: modelName },
        testFlow: modelData.defaultFlow
      });
    }
  };

  const handleAIAnalysis = async () => {
    setIsGenerating(true);
    const summary = await generateCalibrationObservations(report);
    setReport(prev => ({ ...prev, aiSummary: summary }));
    setIsGenerating(false);
  };

  const saveToHistory = () => {
    const newHistory = [report, ...savedReports.filter(r => r.id !== report.id)];
    setSavedReports(newHistory);
    localStorage.setItem('bemet_calibration_history', JSON.stringify(newHistory));
    alert("Reporte guardado exitosamente en el historial local.");
  };

  const loadFromHistory = (historicalReport: CalibrationReport) => {
    setReport(historicalReport);
    // Check if the model is one of the defaults
    const isStandard = VAPORIZER_MODELS.some(m => m.name === historicalReport.equipmentData.model);
    setIsCustomModel(!isStandard);
    setActiveTab('calibration');
  };

  const deleteFromHistory = (id: string) => {
    const newHistory = savedReports.filter(r => r.id !== id);
    setSavedReports(newHistory);
    localStorage.setItem('bemet_calibration_history', JSON.stringify(newHistory));
  };

  const startNewReport = () => {
    if (confirm("¿Está seguro de iniciar un nuevo reporte? Se perderán los cambios no guardados en el reporte actual.")) {
      setIsCustomModel(false);
      setReport({
        id: Date.now().toString(),
        clientName: '',
        equipmentData: { brand: '', model: VAPORIZER_MODELS[0].name, serial: '', agent: 'Sevoflurano' },
        standardEquipment: '',
        testFlow: VAPORIZER_MODELS[0].defaultFlow, 
        envConditions: { temp: 20, humidity: 50, pressure: 1013 },
        date: new Date().toISOString().split('T')[0],
        measurements: INITIAL_MEASUREMENTS,
        tolerances: [],
        observations: ''
      });
    }
  };

  const addIncident = (incident: Incident) => {
    setIncidents([incident, ...incidents]);
    setShowIncidentForm(false);
  };

  const updateIncidentStatus = (id: string, status: Status) => {
    setIncidents(incidents.map(inc => inc.id === id ? { ...inc, status } : inc));
  };

  const stats: Stats = {
    total: incidents.length,
    pending: incidents.filter(i => i.status === Status.PENDIENTE).length,
    resolved: incidents.filter(i => i.status === Status.RESUELTO).length,
    critical: incidents.filter(i => i.severity === Severity.CRITICAL).length,
  };

  return (
    <Layout>
      {/* Tab Selector - Hidden on Print */}
      <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl w-fit mb-8 print:hidden">
        <button 
          onClick={() => setActiveTab('calibration')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'calibration' ? 'bg-white text-[#ee7d31] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Calibración
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-[#ee7d31] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Historial {savedReports.length > 0 && <span className="ml-1 bg-[#ee7d31] text-white text-[10px] px-1.5 py-0.5 rounded-full">{savedReports.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('incidents')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'incidents' ? 'bg-white text-[#ee7d31] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Incidencias
        </button>
      </div>

      {activeTab === 'calibration' ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          
          {/* Print Header - EXACT Design from user image */}
          <div className="hidden print:flex items-center justify-between mb-8 pb-6 border-b-2 border-slate-200">
            <div className="flex items-center">
              {/* BEMET LOGO SECTION */}
              <div className="flex items-center">
                <div className="relative w-20 h-20 mr-4">
                  <div className="absolute inset-0 border-[3px] border-[#ee7d31] rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18c.53 0 .96.43.96.96s-.43.96-.96.96-.96-.43-.96-.96.43-.96.96-.96zM12 18c-3.31 0-6-2.69-6-6 0-1.25.38-2.4 1.03-3.35l1.43 1.43c-.29.58-.46 1.23-.46 1.92 0 2.21 1.79 4 4 4s4-1.79 4-4c0-.69-.17-1.34-.46-1.92l1.43-1.43c.65.95 1.03 2.1 1.03 3.35 0 3.31-2.69 6-6 6z"/>
                    </svg>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-10 h-10 text-[#ee7d31]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4.8 2.3A.3.3 0 1 0 5 2a.3.3 0 0 0-.2.3zM3 21h18M3 7h18M12 7v14"/>
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-5xl font-black text-[#ee7d31] tracking-tighter leading-none">bemet<span className="text-slate-500">.</span></h1>
                  <p className="text-[10px] font-bold text-[#ee7d31] tracking-[0.25em] whitespace-nowrap mt-1">INGENIERÍA Y EQUIPO MÉDICO</p>
                </div>
              </div>

              <div className="h-20 w-[2px] bg-[#ee7d31] mx-8"></div>

              <div className="flex flex-col items-center">
                <div className="flex space-x-2 border-2 border-[#ee7d31] p-1 rounded">
                  <div className="flex flex-col items-center justify-center border border-slate-200 px-3 py-1">
                    <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xs italic">INR</div>
                    <span className="text-[6px] text-slate-400 font-bold">International Northern Registrar</span>
                  </div>
                  <div className="flex flex-col items-center justify-center border border-slate-200 px-3 py-1">
                    <div className="w-10 h-10 bg-emerald-700 rounded-full flex items-center justify-center text-white font-bold text-[8px] flex-col leading-none">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z"/></svg>
                      IRQAO
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center border border-slate-200 px-3 py-1 bg-indigo-900 text-white min-w-[50px]">
                    <div className="text-[6px] font-bold">ASCB (E)</div>
                    <div className="text-[4px] leading-tight text-center">Accrediting Certifying Bodies</div>
                  </div>
                </div>
                <div className="mt-1 border-2 border-slate-800 w-full text-center py-0.5">
                  <p className="text-[12px] font-black text-slate-900 leading-none">ISO 9001:2015</p>
                  <p className="text-[10px] font-black text-slate-900 leading-none tracking-[0.1em]">CERTIFIED</p>
                </div>
              </div>
            </div>

            <div className="text-right flex flex-col justify-center">
              <p className="text-[10px] text-slate-400 font-mono mb-1 uppercase tracking-widest">Protocolo Oficial de Metrología</p>
              <p className="text-sm font-black text-slate-800">Reporte ID: <span className="font-mono">{report.id.slice(-8)}</span></p>
              <p className="text-xs font-bold text-[#ee7d31]">{report.date}</p>
            </div>
          </div>

          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:hidden">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#ee7d31] rounded-xl flex items-center justify-center text-white shadow-lg">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">Protocolo de Calibración</h1>
                <p className="text-slate-500 text-sm italic">Certificación bajo Normativa ISO 8835-4</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={startNewReport} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center shadow-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Nuevo
              </button>
              <button onClick={saveToHistory} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-100 transition-colors flex items-center border border-indigo-100 shadow-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                Guardar
              </button>
              <button onClick={() => window.print()} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-slate-200 transition-colors flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                Imprimir
              </button>
              <button onClick={handleAIAnalysis} disabled={isGenerating} className="bg-[#ee7d31] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-[#d9661d] disabled:opacity-50 transition-all shadow-md shadow-orange-100 flex items-center">
                {isGenerating ? 'Analizando...' : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Validación IA
                  </>
                )}
              </button>
            </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-slate-100">
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-[#ee7d31] uppercase tracking-widest flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a7 7 0 00-7 7v1h11v-1a7 7 0 00-7-7z"></path></svg>
                Información del Servicio
              </h2>
              <div className="space-y-3">
                <div className="border-b border-slate-100 pb-1">
                  <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-tighter">CLIENTE / HOSPITAL</label>
                  <input className="w-full bg-transparent py-1 focus:border-[#ee7d31] outline-none transition-all text-sm font-semibold" placeholder="..." value={report.clientName} onChange={e => setReport({...report, clientName: e.target.value})} />
                </div>
                <div className="border-b border-slate-100 pb-1">
                  <label className="text-[10px] font-bold text-slate-400 block uppercase tracking-tighter">EQUIPO PATRÓN UTILIZADO</label>
                  <input className="w-full bg-transparent py-1 focus:border-[#ee7d31] outline-none transition-all text-sm font-semibold" placeholder="..." value={report.standardEquipment} onChange={e => setReport({...report, standardEquipment: e.target.value})} />
                </div>
              </div>
            </div>
            
            <div className="space-y-4 border-x border-slate-100 px-6 print:border-none">
              <h2 className="text-sm font-bold text-[#ee7d31] uppercase tracking-widest flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path></svg>
                Datos del Dispositivo
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">MARCA</label>
                  <input className="w-full border-b border-slate-100 py-1 text-xs font-bold" value={report.equipmentData.brand} onChange={e => setReport({...report, equipmentData: {...report.equipmentData, brand: e.target.value}})} />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">MODELO</label>
                  {!isCustomModel ? (
                    <select 
                      className="w-full border-b border-slate-100 py-1 text-xs font-bold bg-transparent focus:border-[#ee7d31] outline-none" 
                      value={report.equipmentData.model} 
                      onChange={e => handleModelChange(e.target.value)}
                    >
                      {VAPORIZER_MODELS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                      <option value="CUSTOM" className="text-[#ee7d31] font-bold italic">OTRO (Especificar...)</option>
                    </select>
                  ) : (
                    <div className="relative group">
                      <input 
                        className="w-full border-b border-slate-100 py-1 text-xs font-bold bg-transparent pr-6 focus:border-[#ee7d31] outline-none" 
                        placeholder="Especifique modelo..." 
                        autoFocus
                        value={report.equipmentData.model} 
                        onChange={e => setReport({...report, equipmentData: {...report.equipmentData, model: e.target.value}})} 
                      />
                      <button 
                        onClick={() => handleModelChange(VAPORIZER_MODELS[0].name)}
                        className="absolute right-0 top-1 text-slate-300 hover:text-red-500 transition-colors"
                        title="Volver a lista"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">NÚMERO DE SERIE</label>
                  <input className="w-full border-b border-slate-100 py-1 text-xs font-bold font-mono" value={report.equipmentData.serial} onChange={e => setReport({...report, equipmentData: {...report.equipmentData, serial: e.target.value}})} />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">AGENTE</label>
                  <select className="w-full border-b border-slate-100 py-1 text-xs font-bold bg-transparent" value={report.equipmentData.agent} onChange={e => setReport({...report, equipmentData: {...report.equipmentData, agent: e.target.value}})}>
                    <option>Sevoflurano</option>
                    <option>Isoflurano</option>
                    <option>Halotano</option>
                    <option>Desflurano</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">Flujo Prueba</label>
                  <div className="flex items-center">
                    <input type="number" step="0.5" className="w-10 text-xs font-bold text-[#ee7d31] bg-transparent outline-none" value={report.testFlow} onChange={e => setReport({...report, testFlow: +e.target.value})} />
                    <span className="text-[9px] font-bold text-slate-300 ml-1">LPM</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-bold text-[#ee7d31] uppercase tracking-widest flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
                Condiciones de Prueba
              </h2>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Temp</p>
                  <p className="text-xs font-bold text-slate-700">{report.envConditions.temp}°C</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Hum</p>
                  <p className="text-xs font-bold text-slate-700">{report.envConditions.humidity}%</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Pres</p>
                  <p className="text-xs font-bold text-slate-700">{report.envConditions.pressure}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <input type="date" className="bg-transparent text-[10px] font-bold text-slate-500 w-full outline-none" value={report.date} onChange={e => setReport({...report, date: e.target.value})} />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-slate-300 print:shadow-none">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center print:bg-white">
              <div>
                <h2 className="font-bold text-slate-800 text-sm">Registro de Mediciones Técnicas</h2>
                <p className="text-[10px] text-slate-500">Parámetro analizado: Concentración de Agente Volátil (%)</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-[10px] font-black text-slate-400 bg-white px-2 py-1 rounded border border-slate-100 shadow-sm print:hidden">
                  FLUJO: <span className="text-[#ee7d31]">{report.testFlow} LPM</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-[9px] uppercase font-black text-slate-500 print:bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 border-b text-center">Set (%)</th>
                    <th className="px-6 py-3 border-b bg-amber-50/50 text-amber-800 text-center">Recibido</th>
                    <th className="px-6 py-3 border-b text-center">Med 1</th>
                    <th className="px-6 py-3 border-b text-center">Med 2</th>
                    <th className="px-6 py-3 border-b text-center">Med 3</th>
                    <th className="px-6 py-3 border-b bg-indigo-50/50 text-[#ee7d31] text-center">Promedio</th>
                    <th className="px-6 py-3 border-b text-center">Error Abs.</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {report.measurements.map((p, idx) => (
                    <tr key={p.nominal} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-black text-slate-900 bg-slate-50/30 text-center">{p.nominal}%</td>
                      <td className="px-6 py-3 bg-amber-50/20 text-center">
                        <input type="number" step="0.1" className="w-12 bg-transparent text-center font-bold text-amber-700 outline-none" value={p.mReceived} onChange={e => {
                          const newMeas = [...report.measurements];
                          newMeas[idx].mReceived = +e.target.value;
                          setReport({...report, measurements: newMeas});
                        }} />
                      </td>
                      <td className="px-6 py-3 text-center"><input type="number" className="w-10 bg-transparent text-center" value={p.m1} onChange={e => {
                        const newMeas = [...report.measurements];
                        newMeas[idx].m1 = +e.target.value;
                        setReport({...report, measurements: newMeas});
                      }} /></td>
                      <td className="px-6 py-3 text-center"><input type="number" className="w-10 bg-transparent text-center" value={p.m2} onChange={e => {
                        const newMeas = [...report.measurements];
                        newMeas[idx].m2 = +e.target.value;
                        setReport({...report, measurements: newMeas});
                      }} /></td>
                      <td className="px-6 py-3 text-center"><input type="number" className="w-10 bg-transparent text-center" value={p.m3} onChange={e => {
                        const newMeas = [...report.measurements];
                        newMeas[idx].m3 = +e.target.value;
                        setReport({...report, measurements: newMeas});
                      }} /></td>
                      <td className="px-6 py-3 bg-orange-50/20 font-mono font-black text-[#ee7d31] text-center">{p.average}</td>
                      <td className={`px-6 py-3 font-mono font-bold text-center ${Math.abs(p.error) > (p.nominal * 0.15 + 0.1) ? 'text-red-500' : 'text-slate-500'}`}>{p.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:gap-4 print:grid-cols-2">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-slate-300">
              <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center">
                 <div className="w-2 h-2 bg-[#ee7d31] rounded-full mr-2"></div>
                 Tendencia de Linealidad
              </h3>
              <div className="h-48 print:h-40"><canvas id="errorChart"></canvas></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:shadow-none print:border-slate-300">
              <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                 Fronteras de Tolerancia
              </h3>
              <div className="h-48 print:h-40"><canvas id="toleranceChart"></canvas></div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-slate-300">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
              <h2 className="font-bold text-slate-800 text-sm italic">Dictamen Final y Observaciones</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 print:gap-4">
              <div className="space-y-4">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Anotaciones del Ingeniero Responsable</label>
                <textarea className="w-full h-32 text-xs border-none bg-slate-50 rounded-xl p-4 outline-none resize-none print:bg-white print:p-0 print:h-auto" placeholder="..." value={report.observations} onChange={e => setReport({...report, observations: e.target.value})} />
              </div>
              <div className="bg-gradient-to-br from-[#59595b] to-[#3a3a3c] p-6 rounded-2xl text-white shadow-lg print:bg-none print:text-black print:border print:border-slate-200 print:shadow-none">
                <h4 className="text-[10px] font-black uppercase mb-3 text-orange-400 print:text-orange-600">Validación Técnica (Bemet IA)</h4>
                <p className="text-xs leading-relaxed opacity-90 italic">
                  {report.aiSummary || "Análisis en espera de ejecución..."}
                </p>
                <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center print:border-slate-200">
                   <div className="text-center">
                      <div className="w-24 h-[1px] bg-white/30 mb-1 mx-auto print:bg-slate-400"></div>
                      <p className="text-[8px] uppercase font-bold opacity-50">Firma Ingeniero Responsable</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-emerald-400 uppercase print:text-emerald-700">Estado: CERTIFICADO</p>
                   </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : activeTab === 'history' ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Historial de Calibraciones</h2>
             <button 
                onClick={() => { if(confirm("¿Borrar todo el historial?")) { setSavedReports([]); localStorage.removeItem('bemet_calibration_history'); }}}
                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-widest flex items-center"
              >
                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                Limpiar Todo
              </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {savedReports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black text-slate-500">
                    <tr>
                      <th className="px-6 py-4">ID / Fecha</th>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Equipo / Serie</th>
                      <th className="px-6 py-4">Agente</th>
                      <th className="px-6 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {savedReports.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-mono font-bold text-indigo-600">{r.id.slice(-8)}</p>
                          <p className="text-[10px] text-slate-400">{r.date}</p>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{r.clientName || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <p className="text-slate-900 font-bold">{r.equipmentData.model}</p>
                          <p className="text-[10px] font-mono text-slate-500">{r.equipmentData.serial}</p>
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100 font-bold">{r.equipmentData.agent}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center space-x-2">
                            <button 
                              onClick={() => loadFromHistory(r)}
                              className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 shadow-sm transition-all flex items-center"
                              title="Cargar Reporte"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                              <span className="ml-2 text-xs font-bold hidden md:inline">Ver / Editar</span>
                            </button>
                            <button 
                              onClick={() => deleteFromHistory(r.id)}
                              className="bg-red-50 text-red-500 p-2 rounded-lg hover:bg-red-100 transition-all"
                              title="Borrar de Historial"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <svg className="w-16 h-16 mb-4 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p className="font-medium italic">El historial de calibración está vacío.</p>
                <p className="text-xs mt-1">Guarde sus calibraciones para visualizarlas aquí más tarde.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Registro de Incidencias</h2>
            <button 
              onClick={() => setShowIncidentForm(true)}
              className="bg-[#ee7d31] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#d9661d] shadow-lg shadow-orange-100 transition-all flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Reportar Falla
            </button>
          </div>

          <StatsCards stats={stats} />

          {showIncidentForm && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
               <div className="max-w-2xl w-full">
                  <IncidentForm onAdd={addIncident} onCancel={() => setShowIncidentForm(false)} />
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {incidents.length > 0 ? (
              incidents.map(inc => (
                <IncidentCard key={inc.id} incident={inc} onUpdateStatus={updateIncidentStatus} />
              ))
            ) : (
              <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                <p className="font-medium italic">No se han registrado incidencias mecánicas o electrónicas hoy.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
