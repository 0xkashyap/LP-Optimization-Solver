import solver from 'javascript-lp-solver';
import type { NetworkNode, NetworkEdge, SolverResult } from '../types/network';

export function solveTransportation(
  nodes: NetworkNode[],
  edges: NetworkEdge[]
): SolverResult {
  // Calculate total supply and demand
  let totalSupply = 0;
  let totalDemand = 0;

  nodes.forEach((node) => {
    if (node.data.type === 'supply') {
      totalSupply += node.data.quantity || 0;
    } else if (node.data.type === 'demand') {
      totalDemand += node.data.quantity || 0;
    }
  });

  if (nodes.length === 0) {
    return {
      status: 'unsolved',
      totalCost: 0,
      totalSupply: 0,
      totalDemand: 0,
      activeRoutesCount: 0,
      allocations: {},
    };
  }

  // Construct constraints and variables objects for javascript-lp-solver
  const constraints: Record<string, { min?: number; max?: number; equal?: number }> = {};
  const variables: Record<string, Record<string, number>> = {};

  // 1. Initialize constraints for each node
  nodes.forEach((node) => {
    const qty = node.data.quantity || 0;
    if (node.data.type === 'supply') {
      // Outflow - Inflow <= Supply
      constraints[`node_${node.id}`] = { max: qty };
    } else if (node.data.type === 'demand') {
      // Inflow - Outflow >= Demand
      constraints[`node_${node.id}`] = { min: qty };
    } else if (node.data.type === 'transshipment') {
      // Outflow - Inflow = 0
      constraints[`node_${node.id}`] = { equal: 0 };
    }
  });

  // 2. Initialize variables for each edge
  edges.forEach((edge) => {
    const edgeVarName = `edge_${edge.id}`;
    const cost = edge.data?.cost ?? 0;

    variables[edgeVarName] = {
      cost: cost, // objective to minimize
    };

    // Add coefficients to source and target node constraints
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (sourceNode) {
      const constraintKey = `node_${sourceNode.id}`;
      if (sourceNode.data.type === 'supply' || sourceNode.data.type === 'transshipment') {
        // Outflow gets coefficient +1
        variables[edgeVarName][constraintKey] = (variables[edgeVarName][constraintKey] || 0) + 1;
      } else if (sourceNode.data.type === 'demand') {
        // Outflow gets coefficient -1 (since constraint is Inflow - Outflow >= Demand)
        variables[edgeVarName][constraintKey] = (variables[edgeVarName][constraintKey] || 0) - 1;
      }
    }

    if (targetNode) {
      const constraintKey = `node_${targetNode.id}`;
      if (targetNode.data.type === 'supply' || targetNode.data.type === 'transshipment') {
        // Inflow gets coefficient -1
        variables[edgeVarName][constraintKey] = (variables[edgeVarName][constraintKey] || 0) - 1;
      } else if (targetNode.data.type === 'demand') {
        // Inflow gets coefficient +1
        variables[edgeVarName][constraintKey] = (variables[edgeVarName][constraintKey] || 0) + 1;
      }
    }
  });

  // 3. Assemble the model
  const model: solver.Model = {
    optimize: 'cost',
    opType: 'min',
    constraints,
    variables,
  };

  try {
    const solution = solver.Solve(model);

    if (!solution.feasible) {
      return {
        status: 'infeasible',
        totalCost: 0,
        totalSupply,
        totalDemand,
        activeRoutesCount: 0,
        allocations: {},
      };
    }

    // Extract allocations
    const allocations: Record<string, number> = {};
    let activeRoutesCount = 0;

    edges.forEach((edge) => {
      const edgeVarName = `edge_${edge.id}`;
      const flow = solution[edgeVarName] || 0;
      if (flow > 0) {
        allocations[edge.id] = parseFloat(flow.toFixed(4));
        activeRoutesCount++;
      }
    });

    return {
      status: 'optimal',
      totalCost: parseFloat(solution.result.toFixed(4)),
      totalSupply,
      totalDemand,
      activeRoutesCount,
      allocations,
    };
  } catch (error) {
    console.error('LP Solver Error:', error);
    return {
      status: 'error',
      totalCost: 0,
      totalSupply,
      totalDemand,
      activeRoutesCount: 0,
      allocations: {},
    };
  }
}
