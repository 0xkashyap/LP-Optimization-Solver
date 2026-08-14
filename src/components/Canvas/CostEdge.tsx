import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
} from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { X } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import type { NetworkEdge } from '../../types/network';

// Custom cubic Bezier position calculator
function getBezierXY(
  t: number,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): { x: number; y: number } {
  const dx = Math.abs(targetX - sourceX);
  const offset = Math.max(30, dx * 0.5);

  const p0x = sourceX;
  const p0y = sourceY;
  const p1x = sourceX + offset;
  const p1y = sourceY;
  const p2x = targetX - offset;
  const p2y = targetY;
  const p3x = targetX;
  const p3y = targetY;

  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  const x = mt3 * p0x + 3 * mt2 * t * p1x + 3 * mt * t2 * p2x + t3 * p3x;
  const y = mt3 * p0y + 3 * mt2 * t * p1y + 3 * mt * t2 * p2y + t3 * p3y;

  return { x, y };
}

export const CostEdge: React.FC<EdgeProps<NetworkEdge>> = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}) => {
  const { nodes, updateEdgeCost, updateEdgeLabelT, deleteEdge, isElementsLocked, recordHistoryState } = useNetwork();
  const { getViewport } = useReactFlow();

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const sourceNode = nodes.find((n) => n.id === source);
  const targetNode = nodes.find((n) => n.id === target);
  const sourceName = sourceNode?.data.name || source;
  const targetName = targetNode?.data.name || target;

  const cost = data?.cost ?? 0;
  const flow = data?.flow ?? null;
  const labelT = data?.labelT ?? 0.5;
  const isRouteActive = flow !== null && flow > 0;

  // Calculate dynamic label position along the Bezier curve
  const { x: labelX, y: labelY } = getBezierXY(labelT, sourceX, sourceY, targetX, targetY);

  // Determine edge color based on activity
  const edgeStyle = {
    ...style,
    stroke: isRouteActive ? '#10b981' : '#cbd5e1', // emerald-500 if active, slate-300 if idle
    strokeWidth: isRouteActive ? 3.5 : 2,
  };

  // Direct dragging of the cost card along the edge path
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isElementsLocked) return;

    // Prevent dragging if the user is interacting with inputs, buttons, or icons
    const targetEl = e.target as HTMLElement;
    if (targetEl.tagName === 'INPUT' || targetEl.closest('button')) {
      return;
    }

    recordHistoryState();

    e.stopPropagation();
    e.preventDefault();

    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);

    const flowContainer = document.querySelector('.react-flow');
    if (!flowContainer) return;
    const rect = flowContainer.getBoundingClientRect();

    // Get current scale and pan of the flow viewport
    const { x: panX, y: panY, zoom } = getViewport();

    const handlePointerMove = (moveEvent: PointerEvent) => {
      // Map screen cursor coordinate to canvas coordinate
      const mouseX = (moveEvent.clientX - rect.left - panX) / zoom;
      const mouseY = (moveEvent.clientY - rect.top - panY) / zoom;

      // Find t in [0.15, 0.85] that minimizes distance to the cursor
      let bestT = 0.5;
      let minD2 = Infinity;
      for (let t = 0.15; t <= 0.85; t += 0.01) {
        const pt = getBezierXY(t, sourceX, sourceY, targetX, targetY);
        const dx = pt.x - mouseX;
        const dy = pt.y - mouseY;
        const d2 = dx * dx + dy * dy;
        if (d2 < minD2) {
          minD2 = d2;
          bestT = t;
        }
      }
      updateEdgeLabelT(id, bestT);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      el.releasePointerCapture(upEvent.pointerId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <>
      <BaseEdge path={edgePath} style={edgeStyle} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan select-none"
        >
          <div
            onPointerDown={handlePointerDown}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shadow-sm border text-xs font-semibold bg-white transition-all duration-200 group hover:shadow-md hover:border-slate-300 ${
              isElementsLocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
            } ${
              isRouteActive
                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                : 'border-slate-200'
            }`}
            style={{ minWidth: '100px' }}
          >
            {/* Tooltip route details on hover */}
            <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-50 shadow-md">
              {sourceName} → {targetName}
            </div>

            {/* Cost Input or Static Label */}
            <div className="flex items-center gap-0.5">
              <span className="text-[9px] text-slate-400 font-normal">Cost:</span>
              {selected ? (
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => updateEdgeCost(id, parseFloat(e.target.value) || 0)}
                  disabled={isElementsLocked}
                  className="w-10 px-1 py-0.5 text-center font-bold bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                  min="0"
                  step="any"
                  autoFocus
                />
              ) : (
                <span className="font-bold text-slate-800 px-1 py-0.5 text-xs">
                  {cost}
                </span>
              )}
            </div>

            {/* Flow Badge (if solved) */}
            {flow !== null && (
              <div
                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200"
                title="Allocated Flow"
              >
                {flow}
              </div>
            )}

            {/* Delete button */}
            {!isElementsLocked && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteEdge(id);
                }}
                className="text-slate-300 hover:text-red-500 transition-colors rounded p-0.5 hover:bg-slate-100 cursor-pointer"
                title="Delete Route"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
