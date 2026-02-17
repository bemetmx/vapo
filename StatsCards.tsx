
import React from 'react';
import { Stats } from '../types';

interface StatsCardsProps {
  stats: Stats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <p className="text-slate-500 text-sm font-medium">Total Registros</p>
        <div className="mt-2 flex items-baseline">
          <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <p className="text-slate-500 text-sm font-medium">Pendientes</p>
        <div className="mt-2 flex items-baseline">
          <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <p className="text-slate-500 text-sm font-medium">Resueltos</p>
        <div className="mt-2 flex items-baseline">
          <p className="text-3xl font-bold text-emerald-600">{stats.resolved}</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <p className="text-slate-500 text-sm font-medium">Casos Críticos</p>
        <div className="mt-2 flex items-baseline">
          <p className="text-3xl font-bold text-red-600">{stats.critical}</p>
        </div>
      </div>
    </div>
  );
};
