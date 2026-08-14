import React from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MarkerType,
  ControlButton,
} from '@xyflow/react';
import type { NodeTypes, EdgeTypes } from '@xyflow/react';
import { Lock, Unlock, Move } from 'lucide-react';
import { useNetwork } from '../context/NetworkContext';
import { SupplyNode } from './Canvas/SupplyNode';
import { DemandNode } from './Canvas/DemandNode';
import { TransshipmentNode } from './Canvas/TransshipmentNode';
import { CostEdge } from './Canvas/CostEdge';

const nodeTypes: NodeTypes = {
  supply: SupplyNode,
  demand: DemandNode,
  transshipment: TransshipmentNode,
};

const edgeTypes: EdgeTypes = {
  costEdge: CostEdge,
};

export const NetworkCanvas: React.FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    isViewportLocked,
    setIsViewportLocked,
    isElementsLocked,
    setIsElementsLocked,
    recordHistoryState,
  } = useNetwork();

  // Configure directed arrow markers for edges
  const defaultEdgeOptions = {
    type: 'costEdge',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
      color: '#94a3b8', // slate-400
    },
  };

  // Dynamically update marker colors based on flow activity
  const formattedEdges = edges.map((edge) => {
    const flow = edge.data?.flow ?? null;
    const isRouteActive = flow !== null && flow > 0;
    return {
      ...edge,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: isRouteActive ? '#10b981' : '#94a3b8', // emerald-500 if active, slate-400 if idle
      },
    };
  });

  return (
    <div className="flex-1 h-full relative bg-slate-50/50">
      <ReactFlow
        nodes={nodes}
        edges={formattedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodeDragStart={recordHistoryState}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        deleteKeyCode={isElementsLocked ? [] : ['Backend', 'Delete', 'Backspace']}
        nodesDraggable={!isElementsLocked}
        nodesConnectable={!isElementsLocked}
        elementsSelectable={!isElementsLocked}
        zoomOnScroll={!isViewportLocked}
        zoomOnPinch={!isViewportLocked}
        zoomOnDoubleClick={!isViewportLocked}
        panOnDrag={!isViewportLocked}
        preventScrolling={!isViewportLocked}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="#cbd5e1" />
        
        <Controls
          position="top-left"
          className="!bg-white !border-slate-200 !shadow-sm"
          showInteractive={false} // Hide default lock button
        >
          {/* Lock Zoom & Pan Button */}
          <ControlButton
            onClick={() => setIsViewportLocked(!isViewportLocked)}
            title={isViewportLocked ? "Unlock Canvas Zoom/Pan" : "Lock Canvas Zoom/Pan"}
            className={isViewportLocked ? 'is-active !bg-red-50/80' : ''}
          >
            <Move className="custom-control-icon" />
          </ControlButton>

          {/* Lock Elements Button */}
          <ControlButton
            onClick={() => setIsElementsLocked(!isElementsLocked)}
            title={isElementsLocked ? "Unlock Elements (Allow Edits)" : "Lock Elements (Prevent Edits)"}
            className={isElementsLocked ? 'is-active !bg-red-50/80' : ''}
          >
            {isElementsLocked ? (
              <Lock className="custom-control-icon" />
            ) : (
              <Unlock className="custom-control-icon" />
            )}
          </ControlButton>
        </Controls>
      </ReactFlow>
    </div>
  );
};
