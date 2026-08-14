import React, { useState } from 'react';
import {
  Plus,
  MoreVertical,
  Edit2,
  Copy,
  Download,
  Trash2,
  Network,
  Calendar,
  Search,
} from 'lucide-react';
import { useNetwork } from '../context/NetworkContext';
import { NetworkThumbnail } from './Canvas/NetworkThumbnail';
import { exportProjectToPdf } from '../utils/pdfExport';

export const ProjectsPage: React.FC = () => {
  const {
    projects,
    createProject,
    loadProject,
    renameProject,
    duplicateProject,
    deleteProject,
  } = useNetwork();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRename = (id: string, currentName: string) => {
    setActiveMenuId(null);
    const newName = prompt('Enter a new name for this project:', currentName);
    if (newName && newName.trim()) {
      renameProject(id, newName.trim());
    }
  };

  const handleDuplicate = (id: string) => {
    setActiveMenuId(null);
    duplicateProject(id);
  };

  const handleDelete = (id: string, name: string) => {
    setActiveMenuId(null);
    if (confirm(`Are you sure you want to delete the project "${name}"?`)) {
      deleteProject(id);
    }
  };

  const handleExport = (id: string) => {
    setActiveMenuId(null);
    const proj = projects.find((p) => p.id === id);
    if (proj) {
      exportProjectToPdf(proj);
    }
  };

  return (
    <div className="h-screen w-screen overflow-y-auto bg-slate-50 flex flex-col font-sans select-none">
      {/* Landing Page Header */}
      <header className="h-16 bg-slate-950 text-white flex items-center justify-between px-8 border-b border-slate-800 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md">
            <Network className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-md font-bold text-slate-100 leading-none">
              LP Optimization Solver
            </span>
          </div>
        </div>

        <button
          onClick={createProject}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-8 py-8 flex flex-col space-y-6">
        
        {/* Subheader and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div>
            <h1 className="text-xl font-bold text-slate-800">My Projects</h1>
            <p className="text-xs text-slate-500 mt-1">
              Select an optimization model to edit or create a new transportation network.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Project Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const nodesCount = project.nodes.length;
              const edgesCount = project.edges.length;
              const dateFormatted = new Date(project.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={project.id}
                  onClick={() => loadProject(project.id)}
                  className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 hover:scale-[1.01] active:scale-[0.99] transition-all flex flex-col overflow-visible cursor-pointer group ${
                    activeMenuId === project.id ? 'relative z-30' : 'relative z-10'
                  }`}
                >
                  {/* Thumbnail Wrapper */}
                  <div className="p-4 pb-2">
                    <NetworkThumbnail nodes={project.nodes} edges={project.edges} />
                  </div>

                  {/* Card Description */}
                  <div className="p-4 pt-1 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-800 text-sm line-clamp-1 flex-1 transition-colors group-hover:text-indigo-600" title={project.name}>
                          {project.name}
                        </h3>
                        
                        {/* Three-Dot Menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === project.id ? null : project.id);
                            }}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {/* Dropdown Menu Options */}
                          {activeMenuId === project.id && (
                            <>
                              {/* Invisible backdrop layer to click close menu */}
                              <div
                                className="fixed inset-0 z-40"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                }}
                              />
                              <div className="absolute right-0 mt-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs font-semibold text-slate-700 animate-in fade-in slide-in-from-top-1 duration-150">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRename(project.id, project.name);
                                  }}
                                  className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-left"
                                >
                                  <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                                  <span>Rename</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicate(project.id);
                                  }}
                                  className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-left"
                                >
                                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                                  <span>Duplicate</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExport(project.id);
                                  }}
                                  className="w-full px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-left"
                                >
                                  <Download className="h-3.5 w-3.5 text-slate-400" />
                                  <span>Export PDF</span>
                                </button>
                                <div className="border-t border-slate-100 my-1" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(project.id, project.name);
                                  }}
                                  className="w-full px-3.5 py-2 hover:bg-slate-50 text-red-600 hover:text-red-700 flex items-center gap-2 cursor-pointer text-left"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Network node/edge counts */}
                      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-2">
                        <span>Nodes: <strong className="text-slate-600 font-extrabold">{nodesCount}</strong></span>
                        <span>Edges: <strong className="text-slate-600 font-extrabold">{edgesCount}</strong></span>
                      </div>
                    </div>

                    {/* Bottom Metadata */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-slate-300" />
                        <span>{dateFormatted}</span>
                      </div>

                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest group-hover:text-indigo-700 transition-colors flex items-center gap-1">
                        Open Model →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-200 bg-white rounded-3xl text-center p-6">
            <div className="bg-slate-100 p-4 rounded-full text-slate-400 mb-4">
              <Network className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">No Projects Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[280px] leading-relaxed">
              {searchQuery ? 'Adjust your search queries or clear the input to locate your models.' : 'Create your first project model to get started with visual transportation optimization.'}
            </p>
            {!searchQuery && (
              <button
                onClick={createProject}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Create Project
              </button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/80 text-center text-[10px] font-medium text-slate-400 mt-auto shrink-0 select-none bg-slate-50">
        © 2026 Kashyap Panchal · LP Optimization Solver · All rights reserved.
      </footer>
    </div>
  );
};
