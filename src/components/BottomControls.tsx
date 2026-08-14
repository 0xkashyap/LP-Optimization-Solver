import React from 'react';
import { Plus, Package, Building2, Shuffle } from 'lucide-react';
import { useNetwork } from '../context/NetworkContext';

export const BottomControls: React.FC = () => {
  const { addNode, isElementsLocked } = useNetwork();

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-slate-200/60 flex items-center gap-3 z-40 select-none sm:w-[725px] sm:justify-between">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest border-r border-slate-200 pr-3.5 mr-1 hidden sm:block whitespace-nowrap">
        Setup Nodes
      </div>

      <button
        onClick={() => addNode('supply')}
        disabled={isElementsLocked}
        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded-xl text-xs font-bold transition-all border border-indigo-100 shadow-sm hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100"
      >
        <Package className="h-4 w-4" />
        <Plus className="h-3 w-3 stroke-[3]" />
        <span>Supply Source</span>
      </button>

      <button
        onClick={() => addNode('transshipment')}
        disabled={isElementsLocked}
        className="flex items-center gap-1.5 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-800 rounded-xl text-xs font-bold transition-all border border-purple-100 shadow-sm hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100"
      >
        <Shuffle className="h-4 w-4" />
        <Plus className="h-3 w-3 stroke-[3]" />
        <span>Transshipment Hub</span>
      </button>

      <button
        onClick={() => addNode('demand')}
        disabled={isElementsLocked}
        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 rounded-xl text-xs font-bold transition-all border border-emerald-100 shadow-sm hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100"
      >
        <Building2 className="h-4 w-4" />
        <Plus className="h-3 w-3 stroke-[3]" />
        <span>Demand Sink</span>
      </button>
    </div>
  );
};
