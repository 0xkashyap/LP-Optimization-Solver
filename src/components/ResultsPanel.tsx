import React from 'react';
import { Play, RotateCcw, AlertTriangle, CheckCircle, HelpCircle, ArrowRight } from 'lucide-react';
import { useNetwork } from '../context/NetworkContext';

export const ResultsPanel: React.FC = () => {
  const { nodes, edges, solverResult, solve, resetSolver } = useNetwork();
  const { status, totalCost, totalSupply, totalDemand, activeRoutesCount, allocations } = solverResult;

  const hasNetwork = nodes.length > 0;

  // Find node names by ID for allocations listing
  const getNodeName = (id: string) => {
    return nodes.find((n) => n.id === id)?.data.name || id;
  };

  return (
    <div className="w-full h-full bg-white flex flex-col select-none">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Results & Analysis
        </h2>
        {status !== 'unsolved' && (
          <button
            onClick={resetSolver}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100"
            title="Reset Solver"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Solve Action Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
          <button
            onClick={solve}
            disabled={!hasNetwork}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white shadow-md transition-all active:scale-[0.98] ${
              hasNetwork
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.01]'
                : 'bg-slate-300 cursor-not-allowed shadow-none'
            }`}
          >
            <Play className="h-4 w-4 fill-white" />
            <span>SOLVE PROBLEM</span>
          </button>
        </div>

        {/* Status Card */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Optimality Status
          </h3>
          <div className="flex items-center gap-3">
            {status === 'unsolved' && (
              <div className="flex items-center gap-2 text-slate-500 bg-slate-100 border border-slate-200 w-full px-3.5 py-2 rounded-xl text-xs font-semibold">
                <HelpCircle className="h-4 w-4" />
                <span>Ready to Solve</span>
              </div>
            )}
            {status === 'optimal' && (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 w-full px-3.5 py-2 rounded-xl text-xs font-semibold">
                <CheckCircle className="h-4 w-4" />
                <span>Optimal Solution Found</span>
              </div>
            )}
            {status === 'infeasible' && (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 w-full px-3.5 py-2 rounded-xl text-xs font-semibold">
                <AlertTriangle className="h-4 w-4" />
                <span>Problem Infeasible</span>
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 w-full px-3.5 py-2 rounded-xl text-xs font-semibold">
                <AlertTriangle className="h-4 w-4" />
                <span>Error Solving LP</span>
              </div>
            )}
          </div>
        </div>

        {/* Network Metrics */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Total Supply
            </span>
            <span className="text-lg font-bold text-slate-800">{totalSupply}</span>
          </div>

          <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Total Demand
            </span>
            <span className="text-lg font-bold text-slate-800">{totalDemand}</span>
          </div>
        </div>


        {/* Optimization Metrics (only shown if optimal) */}
        {status === 'optimal' && (
          <>
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md border border-slate-800">
              <span className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">
                Optimized Total Cost
              </span>
              <span className="text-2xl font-black">${totalCost.toLocaleString()}</span>
              <span className="block text-[10px] text-slate-400 mt-2">
                Active Routes: <strong className="text-white">{activeRoutesCount}</strong>
              </span>
            </div>

            {/* Route Allocations list */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Route Allocation Details
              </h3>
              <div className="space-y-2">
                {edges.map((edge) => {
                  const flow = allocations[edge.id] || 0;
                  if (flow === 0) return null;

                  const cost = edge.data?.cost || 0;
                  const totalRouteCost = flow * cost;

                  return (
                    <div
                      key={edge.id}
                      className="border border-slate-100 hover:border-slate-200 bg-white rounded-xl p-3 space-y-1.5 shadow-sm"
                    >
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                        <span className="text-slate-800 max-w-[100px] truncate" title={getNodeName(edge.source)}>
                          {getNodeName(edge.source)}
                        </span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                        <span className="text-slate-800 max-w-[100px] truncate" title={getNodeName(edge.target)}>
                          {getNodeName(edge.target)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">
                          Qty: <strong className="text-slate-800">{flow}</strong> @ ${cost}
                        </span>
                        <span className="font-bold text-slate-800">${totalRouteCost}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {status === 'infeasible' && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-xs text-red-800 space-y-2">
            <h4 className="font-bold">Why is it infeasible?</h4>
            <p className="leading-relaxed">
              An LP is infeasible when there is no flow path that can satisfy all demand requirements without violating supply capacities or flow conservation.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Ensure Total Supply &ge; Total Demand.</li>
              <li>Check that supply nodes are connected to demand sinks (either directly or via transshipment nodes).</li>
            </ul>
          </div>
        )}

        {status === 'unsolved' && (
          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 p-4">
            <span className="text-xs font-semibold mb-1">Solver Idle</span>
            <p className="text-[11px] leading-relaxed">
              Verify your node quantities and connection costs, then click Solve to compute flow allocations.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 text-center text-[9px] font-medium text-slate-400 select-none bg-slate-50/40 shrink-0">
        © 2026 Kashyap Panchal · LP Optimization Solver · All rights reserved.
      </div>
    </div>
  );
};
