import type { Node, Edge } from '@xyflow/react';

export type NodeType = 'supply' | 'demand' | 'transshipment';

export interface CustomNodeData extends Record<string, unknown> {
  name: string;
  type: NodeType;
  quantity: number; // supply for 'supply', demand for 'demand', 0 for 'transshipment'
}

export interface CustomEdgeData extends Record<string, unknown> {
  cost: number;
  flow: number | null; // null if not yet solved
  labelT?: number; // position along the curve (0.1 - 0.9)
}

export type NetworkNode = Node<CustomNodeData, NodeType>;
export type NetworkEdge = Edge<CustomEdgeData>;

export interface SolverResult {
  status: 'optimal' | 'infeasible' | 'unbounded' | 'unsolved' | 'error';
  totalCost: number;
  totalSupply: number;
  totalDemand: number;
  activeRoutesCount: number;
  allocations: Record<string, number>; // key is edge ID, value is flow amount
}

export interface Project {
  id: string;
  name: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  updatedAt: string; // ISO String
}
