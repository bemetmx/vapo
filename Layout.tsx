
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#ee7d31] rounded-lg flex items-center justify-center text-white shadow-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-[#59595b] tracking-tighter">BEMET</h1>
              <p className="text-[10px] text-[#ee7d31] font-bold uppercase tracking-widest leading-none">Ingeniería y Equipo Médico</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <div className="hidden md:block text-right mr-4">
                <p className="text-xs font-bold text-slate-700">Sistema Metrológico</p>
                <p className="text-[10px] text-slate-400">v2.1.0-ISO9001</p>
             </div>
             <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-[#ee7d31]/20 overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=tech" alt="User" />
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 print:p-0">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#59595b]">BEMET</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex space-x-4 text-[10px] font-bold uppercase tracking-widest">
            <span>ISO 9001:2015 Certified</span>
            <span className="text-[#ee7d31]">Ingeniería de Excelencia</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
