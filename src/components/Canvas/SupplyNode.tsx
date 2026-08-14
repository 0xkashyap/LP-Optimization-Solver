import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Trash2, Package } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import type { NetworkNode } from '../../types/network';

export const SupplyNode: React.FC<NodeProps<NetworkNode>> = ({ id, data }) => {
  const { updateNodeQuantity, updateNodeName, deleteNode, edges, solverResult, isElementsLocked } = useNetwork();

  const capacity = data.quantity || 0;
  const totalOutflow = edges
    .filter((edge) => edge.source === id)
    .reduce((sum, edge) => sum + (edge.data?.flow || 0), 0);

  const remainingSupply = Math.max(0, capacity - totalOutflow);
  const isSolved = solverResult.status === 'optimal';

  return (
    <div className="bg-white rounded-xl shadow-md border border-indigo-100 w-64 overflow-hidden transition-all hover:shadow-lg hover:border-indigo-300">
      {/* Node Header */}
      <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Supply Source</span>
        </div>
        {!isElementsLocked && (
          <button
            onClick={() => deleteNode(id)}
            className="text-indigo-200 hover:text-white transition-colors p-1 rounded hover:bg-indigo-700/50 cursor-pointer"
            title="Delete Node"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Node Body */}
      <div className="p-4 space-y-3 bg-slate-50/50">
        <div>
          <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">
            Node Name
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => updateNodeName(id, e.target.value)}
            disabled={isElementsLocked}
            className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">
            Supply Capacity (Units)
          </label>
          <input
            type="number"
            value={data.quantity || ''}
            onChange={(e) => updateNodeQuantity(id, parseInt(e.target.value) || 0)}
            disabled={isElementsLocked}
            className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            min="0"
          />
        </div>

        {/* Net Balance Display */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-md p-2 flex items-center justify-between">
          <span className="text-xs font-medium text-indigo-700">Net Balance</span>
          <span className="text-xs font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
            {isSolved ? `${remainingSupply} / ${capacity}` : `${capacity} available`}
          </span>
        </div>
      </div>

      {/* Connection Handle - Supply can only be a source */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-indigo-500 border-2 !border-white hover:scale-125 transition-transform"
        id="source"
      />
    </div>
  );
};
