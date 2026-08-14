import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  addEdge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import type {
  Connection,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import type { NetworkNode, NetworkEdge, SolverResult, NodeType, Project } from '../types/network';
import { solveTransportation } from '../solver/transportationSolver';

interface NetworkContextType {
  currentProjectId: string | null;
  projects: Project[];
  projectName: string;
  setProjectName: (name: string) => void;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  solverResult: SolverResult;
  createProject: () => void;
  loadProject: (id: string) => void;
  renameProject: (id: string, newName: string) => void;
  duplicateProject: (id: string) => void;
  deleteProject: (id: string) => void;
  closeProject: () => void;
  addNode: (type: NodeType) => void;
  updateNodeQuantity: (nodeId: string, quantity: number) => void;
  updateNodeName: (nodeId: string, name: string) => void;
  deleteNode: (nodeId: string) => void;
  updateEdgeCost: (edgeId: string, cost: number) => void;
  updateEdgeLabelT: (edgeId: string, labelT: number) => void;
  deleteEdge: (edgeId: string) => void;
  onNodesChange: (changes: NodeChange<NetworkNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<NetworkEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  solve: () => void;
  resetSolver: () => void;
  clearNetwork: () => void;

  // Interactivity Locks
  isViewportLocked: boolean;
  setIsViewportLocked: (locked: boolean) => void;
  isElementsLocked: boolean;
  setIsElementsLocked: (locked: boolean) => void;

  // History & Undo / Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  recordHistoryState: () => void;

  // Manual Saving
  hasUnsavedChanges: boolean;
  saveActiveProject: () => void;
  closeProjectWithPrompt: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

const PROJECTS_LOCAL_STORAGE_KEY = 'transportation_solver_projects';
const ACTIVE_ID_LOCAL_STORAGE_KEY = 'transportation_solver_active_id';

const DEFAULT_NODES: NetworkNode[] = [
  {
    id: 'S1',
    type: 'supply',
    position: { x: 100, y: 150 },
    data: { name: 'Denver', type: 'supply', quantity: 100 },
  },
  {
    id: 'S2',
    type: 'supply',
    position: { x: 100, y: 350 },
    data: { name: 'Houston', type: 'supply', quantity: 150 },
  },
  {
    id: 'T1',
    type: 'transshipment',
    position: { x: 400, y: 250 },
    data: { name: 'Kansas City', type: 'transshipment', quantity: 0 },
  },
  {
    id: 'D1',
    type: 'demand',
    position: { x: 700, y: 150 },
    data: { name: 'Chicago', type: 'demand', quantity: 120 },
  },
  {
    id: 'D2',
    type: 'demand',
    position: { x: 700, y: 350 },
    data: { name: 'Boston', type: 'demand', quantity: 80 },
  },
];

const DEFAULT_EDGES: NetworkEdge[] = [
  {
    id: 'E_S1_T1',
    source: 'S1',
    target: 'T1',
    type: 'costEdge',
    data: { cost: 2, flow: null },
  },
  {
    id: 'E_S2_T1',
    source: 'S2',
    target: 'T1',
    type: 'costEdge',
    data: { cost: 3, flow: null },
  },
  {
    id: 'E_T1_D1',
    source: 'T1',
    target: 'D1',
    type: 'costEdge',
    data: { cost: 2, flow: null },
  },
  {
    id: 'E_T1_D2',
    source: 'T1',
    target: 'D2',
    type: 'costEdge',
    data: { cost: 4, flow: null },
  },
  {
    id: 'E_S1_D1',
    source: 'S1',
    target: 'D1',
    type: 'costEdge',
    data: { cost: 5, flow: null },
  },
  {
    id: 'E_S2_D2',
    source: 'S2',
    target: 'D2',
    type: 'costEdge',
    data: { cost: 6, flow: null },
  },
];

interface HistoryState {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  name: string;
}

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Active editor states
  const [projectName, setProjectNameState] = useState('');
  const [nodes, setNodes, reactFlowOnNodesChange] = useNodesState<NetworkNode>([]);
  const [edges, setEdges, reactFlowOnEdgesChange] = useEdgesState<NetworkEdge>([]);

  // Interactivity locks (segregated)
  const [isViewportLocked, setIsViewportLocked] = useState(false);
  const [isElementsLocked, setIsElementsLocked] = useState(false);

  // Manual save flag
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Undo/Redo Stacks
  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);

  const [solverResult, setSolverResult] = useState<SolverResult>({
    status: 'unsolved',
    totalCost: 0,
    totalSupply: 0,
    totalDemand: 0,
    activeRoutesCount: 0,
    allocations: {},
  });

  // Record History Snapshot
  const recordHistory = useCallback((currentNodes: NetworkNode[], currentEdges: NetworkEdge[], currentName: string) => {
    setPast((prev) => {
      const nextPast = [...prev, { nodes: currentNodes, edges: currentEdges, name: currentName }];
      if (nextPast.length > 50) nextPast.shift();
      return nextPast;
    });
    setFuture([]);
    setHasUnsavedChanges(true);
  }, []);

  const recordHistoryState = useCallback(() => {
    recordHistory(nodes, edges, projectName);
  }, [nodes, edges, projectName, recordHistory]);

  // Undo operation
  const undo = useCallback(() => {
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const nextPast = past.slice(0, -1);

    setFuture((prev) => [
      { nodes, edges, name: projectName },
      ...prev,
    ]);

    setPast(nextPast);
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setProjectNameState(previous.name);
    setHasUnsavedChanges(true);
  }, [past, nodes, edges, projectName, setNodes, setEdges]);

  // Redo operation
  const redo = useCallback(() => {
    if (future.length === 0) return;

    const next = future[0];
    const nextFuture = future.slice(1);

    setPast((prev) => [
      ...prev,
      { nodes, edges, name: projectName },
    ]);

    setFuture(nextFuture);
    setNodes(next.nodes);
    setEdges(next.edges);
    setProjectNameState(next.name);
    setHasUnsavedChanges(true);
  }, [future, nodes, edges, projectName, setNodes, setEdges]);

  // Expose undo/redo availability
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  // 1. Initial Load of projects list & active project
  useEffect(() => {
    const savedProjects = localStorage.getItem(PROJECTS_LOCAL_STORAGE_KEY);
    let loadedProjects: Project[] = [];

    if (savedProjects) {
      try {
        loadedProjects = JSON.parse(savedProjects);
      } catch (e) {
        console.error('Error loading projects list:', e);
      }
    }

    // Seed default project if list is empty
    if (loadedProjects.length === 0) {
      loadedProjects = [
        {
          id: 'demo-project',
          name: 'Global Logistics Hub Model',
          nodes: DEFAULT_NODES,
          edges: DEFAULT_EDGES,
          updatedAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem(PROJECTS_LOCAL_STORAGE_KEY, JSON.stringify(loadedProjects));
    }

    setProjects(loadedProjects);

    // Retrieve active ID if it exists
    const savedActiveId = localStorage.getItem(ACTIVE_ID_LOCAL_STORAGE_KEY);
    if (savedActiveId && loadedProjects.some((p) => p.id === savedActiveId)) {
      const activeProj = loadedProjects.find((p) => p.id === savedActiveId)!;
      setCurrentProjectId(activeProj.id);
      setProjectNameState(activeProj.name);
      setNodes(activeProj.nodes);
      setEdges(activeProj.edges);

      // Clean load has no unsaved changes
      setHasUnsavedChanges(false);
      setPast([]);
      setFuture([]);
      setIsViewportLocked(false);
      setIsElementsLocked(false);
    }
  }, [setNodes, setEdges]);

  // Save active ID to localStorage
  useEffect(() => {
    if (currentProjectId) {
      localStorage.setItem(ACTIVE_ID_LOCAL_STORAGE_KEY, currentProjectId);
    } else {
      localStorage.removeItem(ACTIVE_ID_LOCAL_STORAGE_KEY);
    }
  }, [currentProjectId]);

  // Window exit/reload manual save warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Keybindings for Undo, Redo, Save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentProjectId) return;
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (isCmdOrCtrl) {
        if (e.key === 'z' || e.key === 'Z') {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          redo();
        } else if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          saveActiveProject();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, currentProjectId, hasUnsavedChanges, projectName, nodes, edges]);

  // --- Project Actions ---

  const saveActiveProject = useCallback(() => {
    if (!currentProjectId) return;

    setProjects((prevProjects) => {
      const updated = prevProjects.map((p) => {
        if (p.id === currentProjectId) {
          return {
            ...p,
            name: projectName,
            nodes,
            edges,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });
      localStorage.setItem(PROJECTS_LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    setHasUnsavedChanges(false);
  }, [currentProjectId, projectName, nodes, edges]);

  const createProject = useCallback(() => {
    const newId = `P_${Date.now()}`;
    const newProj: Project = {
      id: newId,
      name: 'Untitled Network Model',
      nodes: [],
      edges: [],
      updatedAt: new Date().toISOString(),
    };

    setProjects((prev) => {
      const updated = [newProj, ...prev];
      localStorage.setItem(PROJECTS_LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    // Immediately load
    setCurrentProjectId(newId);
    setProjectNameState(newProj.name);
    setNodes([]);
    setEdges([]);
    setSolverResult({
      status: 'unsolved',
      totalCost: 0,
      totalSupply: 0,
      totalDemand: 0,
      activeRoutesCount: 0,
      allocations: {},
    });

    setHasUnsavedChanges(false);
    setPast([]);
    setFuture([]);
    setIsViewportLocked(false);
    setIsElementsLocked(false);
  }, [setNodes, setEdges]);

  const loadProject = useCallback(
    (id: string) => {
      const proj = projects.find((p) => p.id === id);
      if (!proj) return;

      setCurrentProjectId(proj.id);
      setProjectNameState(proj.name);
      setNodes(proj.nodes);
      setEdges(proj.edges);
      setSolverResult({
        status: 'unsolved',
        totalCost: 0,
        totalSupply: 0,
        totalDemand: 0,
        activeRoutesCount: 0,
        allocations: {},
      });

      setHasUnsavedChanges(false);
      setPast([]);
      setFuture([]);
      setIsViewportLocked(false);
      setIsElementsLocked(false);
    },
    [projects, setNodes, setEdges]
  );

  const renameProject = useCallback((id: string, newName: string) => {
    setProjects((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, name: newName.trim(), updatedAt: new Date().toISOString() } : p));
      localStorage.setItem(PROJECTS_LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    setCurrentProjectId((currentId) => {
      if (currentId === id) {
        setProjectNameState(newName.trim());
      }
      return currentId;
    });
  }, []);

  const setProjectName = useCallback((newName: string) => {
    if (isElementsLocked) return;
    recordHistory(nodes, edges, projectName);
    setProjectNameState(newName);
    setHasUnsavedChanges(true);
  }, [nodes, edges, projectName, recordHistory, isElementsLocked]);

  const duplicateProject = useCallback(
    (id: string) => {
      const original = projects.find((p) => p.id === id);
      if (!original) return;

      const newId = `P_${Date.now()}`;
      const duplicate: Project = {
        ...original,
        id: newId,
        name: `${original.name} - Copy`,
        updatedAt: new Date().toISOString(),
      };

      setProjects((prev) => {
        const updated = [...prev];
        const idx = updated.findIndex((p) => p.id === id);
        if (idx !== -1) {
          updated.splice(idx + 1, 0, duplicate);
        } else {
          updated.unshift(duplicate);
        }
        localStorage.setItem(PROJECTS_LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    },
    [projects]
  );

  const deleteProject = useCallback(
    (id: string) => {
      setProjects((prev) => {
        const updated = prev.filter((p) => p.id !== id);
        localStorage.setItem(PROJECTS_LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

      setCurrentProjectId((currentId) => {
        if (currentId === id) {
          return null;
        }
        return currentId;
      });
    },
    []
  );

  const closeProject = useCallback(() => {
    setCurrentProjectId(null);
    setProjectNameState('');
    setNodes([]);
    setEdges([]);
    setSolverResult({
      status: 'unsolved',
      totalCost: 0,
      totalSupply: 0,
      totalDemand: 0,
      activeRoutesCount: 0,
      allocations: {},
    });
    setHasUnsavedChanges(false);
    setPast([]);
    setFuture([]);
    setIsViewportLocked(false);
    setIsElementsLocked(false);
  }, [setNodes, setEdges]);

  const closeProjectWithPrompt = useCallback(() => {
    if (hasUnsavedChanges) {
      const choice = confirm(
        'You have unsaved changes.\n\n- Click OK to Save and Exit.\n- Click Cancel to exit WITHOUT saving (changes will be lost).'
      );
      if (choice) {
        saveActiveProject();
      } else {
        const discard = confirm('Are you sure you want to discard all unsaved changes and exit?');
        if (!discard) {
          return; // Abort close operation
        }
      }
    }
    closeProject();
  }, [hasUnsavedChanges, saveActiveProject, closeProject]);

  // --- Graph Edit Operations ---

  const resetSolver = useCallback(() => {
    setSolverResult({
      status: 'unsolved',
      totalCost: 0,
      totalSupply: 0,
      totalDemand: 0,
      activeRoutesCount: 0,
      allocations: {},
    });
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        animated: false,
        data: e.data ? { ...e.data, flow: null } : undefined,
      })) as NetworkEdge[]
    );
  }, [setEdges]);

  const addNode = useCallback(
    (type: NodeType) => {
      if (isElementsLocked) return;
      recordHistory(nodes, edges, projectName);
      resetSolver();
      const typeNodes = nodes.filter((n) => n.data.type === type);
      const count = typeNodes.length;

      let x = 400;
      let typeLabel = 'Transshipment';
      let defaultQty = 0;

      if (type === 'supply') {
        x = 100;
        typeLabel = 'Supply';
        defaultQty = 100;
      } else if (type === 'demand') {
        x = 700;
        typeLabel = 'Demand';
        defaultQty = 80;
      }

      const y = 150 + count * 100;
      const id = `${type.toUpperCase()[0]}${Date.now().toString().slice(-4)}`;

      const newNode: NetworkNode = {
        id,
        type,
        position: { x, y },
        data: {
          name: `${typeLabel} Node ${count + 1}`,
          type,
          quantity: defaultQty,
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setHasUnsavedChanges(true);
    },
    [nodes, edges, projectName, setNodes, resetSolver, recordHistory, isElementsLocked]
  );

  const updateNodeQuantity = useCallback(
    (nodeId: string, quantity: number) => {
      if (isElementsLocked) return;
      recordHistory(nodes, edges, projectName);
      resetSolver();
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                quantity: Math.max(0, quantity),
              },
            };
          }
          return node;
        })
      );
      setHasUnsavedChanges(true);
    },
    [nodes, edges, projectName, setNodes, resetSolver, recordHistory, isElementsLocked]
  );

  const updateNodeName = useCallback(
    (nodeId: string, name: string) => {
      if (isElementsLocked) return;
      recordHistory(nodes, edges, projectName);
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                name,
              },
            };
          }
          return node;
        })
      );
      setHasUnsavedChanges(true);
    },
    [nodes, edges, projectName, setNodes, recordHistory, isElementsLocked]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      if (isElementsLocked) return;
      recordHistory(nodes, edges, projectName);
      resetSolver();
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      setHasUnsavedChanges(true);
    },
    [nodes, edges, projectName, setNodes, setEdges, resetSolver, recordHistory, isElementsLocked]
  );

  const updateEdgeCost = useCallback(
    (edgeId: string, cost: number) => {
      if (isElementsLocked) return;
      recordHistory(nodes, edges, projectName);
      resetSolver();
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === edgeId) {
            return {
              ...edge,
              data: edge.data ? { ...edge.data, cost: Math.max(0, cost) } : { cost: Math.max(0, cost), flow: null },
            };
          }
          return edge;
        }) as NetworkEdge[]
      );
      setHasUnsavedChanges(true);
    },
    [nodes, edges, projectName, setEdges, resetSolver, recordHistory, isElementsLocked]
  );

  const updateEdgeLabelT = useCallback(
    (edgeId: string, labelT: number) => {
      if (isElementsLocked) return;
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === edgeId) {
            return {
              ...edge,
              data: edge.data
                ? { ...edge.data, labelT: Math.min(0.9, Math.max(0.1, labelT)) }
                : { cost: 1, flow: null, labelT },
            };
          }
          return edge;
        }) as NetworkEdge[]
      );
      setHasUnsavedChanges(true);
    },
    [setEdges, isElementsLocked]
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      if (isElementsLocked) return;
      recordHistory(nodes, edges, projectName);
      resetSolver();
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
      setHasUnsavedChanges(true);
    },
    [nodes, edges, projectName, setEdges, resetSolver, recordHistory, isElementsLocked]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (isElementsLocked) return;
      recordHistory(nodes, edges, projectName);
      resetSolver();
      const { source, target } = connection;

      if (!source || !target || source === target) return;

      const srcNode = nodes.find((n) => n.id === source);
      const tgtNode = nodes.find((n) => n.id === target);

      if (!srcNode || !tgtNode) return;
      if (tgtNode.data.type === 'supply') return;
      if (srcNode.data.type === 'demand') return;

      const exists = edges.some((e) => e.source === source && e.target === target);
      if (exists) return;

      const newEdge: NetworkEdge = {
        id: `E_${source}_${target}`,
        source,
        target,
        type: 'costEdge',
        data: { cost: 1, flow: null },
      };

      setEdges((eds) => addEdge(newEdge, eds) as NetworkEdge[]);
      setHasUnsavedChanges(true);
    },
    [nodes, edges, projectName, setEdges, resetSolver, recordHistory, isElementsLocked]
  );

  const solve = useCallback(() => {
    const result = solveTransportation(nodes, edges);
    setSolverResult(result);

    setEdges((eds) =>
      eds.map((e) => {
        const flow = result.allocations[e.id] ?? 0;
        return {
          ...e,
          animated: flow > 0,
          data: e.data ? { ...e.data, flow } : { cost: 0, flow },
        };
      }) as NetworkEdge[]
    );
  }, [nodes, edges, setEdges]);

  const clearNetwork = useCallback(() => {
    if (isElementsLocked) return;
    recordHistory(nodes, edges, projectName);
    setNodes([]);
    setEdges([]);
    setSolverResult({
      status: 'unsolved',
      totalCost: 0,
      totalSupply: 0,
      totalDemand: 0,
      activeRoutesCount: 0,
      allocations: {},
    });
    setHasUnsavedChanges(true);
  }, [nodes, edges, projectName, setNodes, setEdges, recordHistory, isElementsLocked]);

  // Intercept React Flow nodes changes to register removals & drag events
  const onNodesChange = useCallback(
    (changes: NodeChange<NetworkNode>[]) => {
      if (isElementsLocked) return;
      const hasRemoval = changes.some((c) => c.type === 'remove');
      if (hasRemoval) {
        recordHistory(nodes, edges, projectName);
      }

      const hasPosition = changes.some((c) => c.type === 'position');
      if (hasPosition || hasRemoval) {
        setHasUnsavedChanges(true);
      }

      reactFlowOnNodesChange(changes);
    },
    [nodes, edges, projectName, recordHistory, reactFlowOnNodesChange, isElementsLocked]
  );

  // Intercept React Flow edges changes to register removals
  const onEdgesChange = useCallback(
    (changes: EdgeChange<NetworkEdge>[]) => {
      if (isElementsLocked) return;
      const hasRemoval = changes.some((c) => c.type === 'remove');
      if (hasRemoval) {
        recordHistory(nodes, edges, projectName);
        setHasUnsavedChanges(true);
      }

      reactFlowOnEdgesChange(changes);
    },
    [nodes, edges, projectName, recordHistory, reactFlowOnEdgesChange, isElementsLocked]
  );

  return (
    <NetworkContext.Provider
      value={{
        currentProjectId,
        projects,
        projectName,
        setProjectName,
        nodes,
        edges,
        solverResult,
        createProject,
        loadProject,
        renameProject,
        duplicateProject,
        deleteProject,
        closeProject,
        addNode,
        updateNodeQuantity,
        updateNodeName,
        deleteNode,
        updateEdgeCost,
        updateEdgeLabelT,
        deleteEdge,
        onNodesChange,
        onEdgesChange,
        onConnect,
        solve,
        resetSolver,
        clearNetwork,

        // Interactivity Locks
        isViewportLocked,
        setIsViewportLocked,
        isElementsLocked,
        setIsElementsLocked,

        // History
        undo,
        redo,
        canUndo,
        canRedo,
        recordHistoryState,

        // Manual Saving
        hasUnsavedChanges,
        saveActiveProject,
        closeProjectWithPrompt,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
