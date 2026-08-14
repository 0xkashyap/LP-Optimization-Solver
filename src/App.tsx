import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { NetworkProvider, useNetwork } from './context/NetworkContext';
import { TopBar } from './components/TopBar';
import { NetworkCanvas } from './components/NetworkCanvas';
import { ResultsPanel } from './components/ResultsPanel';
import { BottomControls } from './components/BottomControls';
import { ProjectsPage } from './components/ProjectsPage';

function MainLayout() {
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* Top Header */}
      <TopBar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Canvas & Bottom Controls Container (centered relative to canvas only) */}
        <div className="flex-1 h-full relative overflow-hidden">
          {/* React Flow Network Canvas */}
          <NetworkCanvas />

          {/* Floating Controls centered strictly on the canvas viewport */}
          <BottomControls />
        </div>

        {/* Collapsible Sidebar Container */}
        <div
          className={`h-full relative transition-all duration-300 ease-in-out bg-white ${
            isPanelOpen ? 'w-80 border-l border-slate-200 shadow-sm' : 'w-0 border-l-0 shadow-none'
          }`}
        >
          {/* Circular Toggle Button positioned on the border */}
          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className={`w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-slate-800 rounded-full shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer absolute top-1/2 -translate-y-1/2 z-50 ${
              isPanelOpen ? '-left-4' : '-left-10'
            }`}
            title={isPanelOpen ? "Collapse Panel" : "Expand Panel"}
          >
            {isPanelOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {/* Inner panel clip container to handle animation overflow */}
          <div className="w-80 h-full overflow-hidden shrink-0">
            <ResultsPanel />
          </div>
        </div>

      </div>
    </div>
  );
}

function NavigationWrapper() {
  const { currentProjectId } = useNetwork();

  // If no project is selected, render the Projects Landing Page
  if (currentProjectId === null) {
    return <ProjectsPage />;
  }

  // Otherwise render the active Project Canvas & Solver Layout
  return <MainLayout />;
}

function App() {
  return (
    <NetworkProvider>
      <NavigationWrapper />
    </NetworkProvider>
  );
}

export default App;
