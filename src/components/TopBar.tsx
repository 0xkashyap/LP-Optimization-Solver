import React, { useState, useEffect } from 'react';
import { Network, Trash2, HelpCircle, ArrowLeft, Download, Save, Undo2, Redo2 } from 'lucide-react';
import { useNetwork } from '../context/NetworkContext';
import { exportProjectToPdf } from '../utils/pdfExport';

export const TopBar: React.FC = () => {
  const {
    projectName,
    setProjectName,
    clearNetwork,
    currentProjectId,
    nodes,
    edges,
    hasUnsavedChanges,
    saveActiveProject,
    closeProjectWithPrompt,
    undo,
    redo,
    canUndo,
    canRedo,
    isElementsLocked,
  } = useNetwork();

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(projectName);

  // Synchronize local input state when opening a different project
  useEffect(() => {
    setNameInput(projectName);
  }, [projectName]);

  const handleBlur = () => {
    setIsEditing(false);
    if (nameInput.trim()) {
      setProjectName(nameInput.trim());
    } else {
      setNameInput(projectName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  const handleExport = () => {
    exportProjectToPdf({
      id: currentProjectId || 'active',
      name: projectName,
      nodes,
      edges,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <header className="h-16 bg-slate-950 text-white flex items-center justify-between px-6 border-b border-slate-800 shadow-md select-none shrink-0 animate-in fade-in slide-in-from-top-1 duration-200">
      {/* Brand, Back Button & Project Title */}
      <div className="flex items-center gap-4">
        {/* Back Button to Projects Landing Page with exit confirmations */}
        <button
          onClick={closeProjectWithPrompt}
          className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer mr-1"
          title="Back to Projects"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md">
          <Network className="h-5 w-5" />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
              LP Optimization Solver
            </span>
            {hasUnsavedChanges ? (
              <span className="text-[9px] text-amber-400 bg-amber-950/40 border border-amber-900/60 px-1.5 py-0.5 rounded font-bold tracking-wide leading-none">
                Unsaved Changes
              </span>
            ) : (
              <span className="text-[9px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-1.5 py-0.5 rounded font-bold tracking-wide leading-none">
                Saved
              </span>
            )}
          </div>
          {isEditing ? (
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              className="text-md font-semibold bg-slate-800 text-white border-b-2 border-indigo-500 px-1 outline-none rounded-sm min-w-[280px]"
            />
          ) : (
            <span
              onClick={() => !isElementsLocked && setIsEditing(true)}
              className={`text-md font-semibold border-b border-transparent pb-0.5 leading-none transition-colors ${
                isElementsLocked ? 'cursor-default text-slate-350' : 'cursor-pointer hover:border-slate-500 hover:text-slate-200'
              }`}
              title={isElementsLocked ? undefined : "Click to rename project"}
            >
              {projectName}
            </span>
          )}
        </div>

        {/* Undo / Redo Actions in Header */}
        <div className="flex items-center gap-1 border-l border-slate-800 pl-4 ml-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
              canUndo
                ? 'text-slate-300 hover:text-white hover:bg-slate-900 cursor-pointer active:scale-95'
                : 'text-slate-600 cursor-not-allowed opacity-50'
            }`}
            title="Undo last change (Cmd/Ctrl + Z)"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
              canRedo
                ? 'text-slate-300 hover:text-white hover:bg-slate-900 cursor-pointer active:scale-95'
                : 'text-slate-600 cursor-not-allowed opacity-50'
            }`}
            title="Redo change (Cmd/Ctrl + Y)"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Top Utilities */}
      <div className="flex items-center gap-3">
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Web Solver Sandbox</span>
        </div>

        {/* Manual Save Button */}
        <button
          onClick={saveActiveProject}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            hasUnsavedChanges
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/20 active:scale-98'
              : 'bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800'
          }`}
          title="Save project changes (Cmd/Ctrl + S)"
        >
          <Save className="h-3.5 w-3.5" />
          <span>Save</span>
        </button>

        {/* Export PDF Button */}
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/40 hover:bg-indigo-950/80 text-indigo-400 border border-indigo-900/60 hover:border-indigo-800/80 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          title="Export model report as PDF"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export PDF</span>
        </button>

        <button
          onClick={clearNetwork}
          disabled={isElementsLocked}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isElementsLocked
              ? 'bg-slate-900 text-slate-650 border border-slate-900 cursor-not-allowed opacity-50'
              : 'bg-red-950/40 hover:bg-red-950/80 text-red-400 border border-red-900/60 hover:border-red-800/80 cursor-pointer'
          }`}
          title="Clear all nodes and connections"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Clear Canvas</span>
        </button>

        <a
          href="https://en.wikipedia.org/wiki/Transportation_theory_(mathematics)"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          title="Learn about Transportation Problems"
        >
          <HelpCircle className="h-4.5 w-4.5" />
        </a>
      </div>
    </header>
  );
};
