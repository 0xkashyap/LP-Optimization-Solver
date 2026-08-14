import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import { Trash2, Shuffle } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import type { NetworkNode } from '../../types/network';

export const TransshipmentNode: React.FC<NodeProps<NetworkNode>> = ({ id, data }) => {
  const { updateNodeName, deleteNode, isElementsLocked } = useNetwork();

  return (
    <div className="bg-white rounded-xl shadow-md border border-purple-100 w-64 overflow-hidden transition-all hover:shadow-lg hover:border-purple-300">
      {/* Node Header */}
      <div className="bg-purple-600 px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Shuffle className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Transshipment</span>
        </div>
        {!isElementsLocked && (
          <button
            onClick={() => deleteNode(id)}
            className="text-purple-200 hover:text-white transition-colors p-1 rounded hover:bg-purple-700/50 cursor-pointer"
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
            className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
          />
        </div>

        <div className="bg-purple-50 border border-purple-100 rounded-md p-2 flex items-center justify-between">
          <span className="text-xs font-medium text-purple-700">Net Flow Balance</span>
          <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
            0 (Conserved)
          </span>
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-purple-500 border-2 !border-white hover:scale-125 transition-transform"
        id="target"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-purple-500 border-2 !border-white hover:scale-125 transition-transform"
        id="source"
      />
    </div>
  );
};
