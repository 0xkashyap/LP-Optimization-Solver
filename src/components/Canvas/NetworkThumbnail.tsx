import React from 'react';
import type { NetworkNode, NetworkEdge } from '../../types/network';

interface NetworkThumbnailProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export const NetworkThumbnail: React.FC<NetworkThumbnailProps> = ({ nodes, edges }) => {
  const width = 240;
  const height = 120;

  if (!nodes || nodes.length === 0) {
    return (
      <div className="w-full h-[120px] bg-slate-50 flex items-center justify-center border border-slate-100 rounded-xl select-none">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Empty Network
        </span>
      </div>
    );
  }

  // 1. Calculate boundaries of node coordinates
  const xCoords = nodes.map((n) => n.position.x);
  const yCoords = nodes.map((n) => n.position.y);

  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const minY = Math.min(...yCoords);
  const maxY = Math.max(...yCoords);

  const xRange = maxX - minX;
  const yRange = maxY - minY;

  // Scaling margins
  const paddingX = 24;
  const paddingY = 18;

  const getScaledX = (x: number) => {
    if (xRange === 0) return width / 2;
    return paddingX + ((x - minX) / xRange) * (width - 2 * paddingX);
  };

  const getScaledY = (y: number) => {
    if (yRange === 0) return height / 2;
    return paddingY + ((y - minY) / yRange) * (height - 2 * paddingY);
  };

  // Node radius in preview
  const nodeRadius = 5;

  return (
    <div className="w-full h-[120px] bg-slate-50 border border-slate-100 rounded-xl overflow-hidden relative shadow-inner">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="block"
      >
        <defs>
          {/* Faint dotted grid background */}
          <pattern id="thumbGrid" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" fill="#cbd5e1" />
          </pattern>

          {/* Directed arrowhead marker */}
          <marker
            id="thumbArrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="#94a3b8" />
          </marker>
        </defs>

        {/* Grid Background */}
        <rect width="100%" height="100%" fill="url(#thumbGrid)" />

        {/* 2. Draw Edges */}
        {edges.map((edge) => {
          const srcNode = nodes.find((n) => n.id === edge.source);
          const tgtNode = nodes.find((n) => n.id === edge.target);

          if (!srcNode || !tgtNode) return null;

          const x1 = getScaledX(srcNode.position.x);
          const y1 = getScaledY(srcNode.position.y);
          const x2 = getScaledX(tgtNode.position.x);
          const y2 = getScaledY(tgtNode.position.y);

          // Calculate vector math to shorten edge lines so arrowheads don't overlap circles
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);

          if (len === 0) return null;

          const ux = dx / len;
          const uy = dy / len;

          // Shorten path slightly at start and end
          const startX = x1 + ux * (nodeRadius + 2);
          const startY = y1 + uy * (nodeRadius + 2);
          const endX = x2 - ux * (nodeRadius + 4);
          const endY = y2 - uy * (nodeRadius + 4);

          return (
            <line
              key={edge.id}
              x1={startX}
              y1={startY}
              x2={endX}
              y2={endY}
              stroke="#cbd5e1"
              strokeWidth="1.2"
              markerEnd="url(#thumbArrow)"
            />
          );
        })}

        {/* 3. Draw Nodes */}
        {nodes.map((node) => {
          const cx = getScaledX(node.position.x);
          const cy = getScaledY(node.position.y);

          let fill = '#9333ea'; // transshipment (purple)
          if (node.type === 'supply') {
            fill = '#4f46e5'; // supply (indigo)
          } else if (node.type === 'demand') {
            fill = '#10b981'; // demand (emerald)
          }

          return (
            <circle
              key={node.id}
              cx={cx}
              cy={cy}
              r={nodeRadius}
              fill={fill}
              stroke="#ffffff"
              strokeWidth="1.2"
              className="transition-transform hover:scale-125"
            />
          );
        })}
      </svg>
    </div>
  );
};
