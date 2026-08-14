# LP Optimization Solver

A premium, interactive web application built to help Operations Research and Management Science students visually formulate, solve, and analyze transportation and transshipment optimization models directly in the browser.

### [Click here](https://lp-optimization-solver.netlify.app) to try out the tool or scroll below to install it locally.

## 🚀 Key Features

### 1. Visual Network Editor
* **Node Types**: Create and configure **Supply Sources** (with capacity limits), **Demand Sinks** (with requirements), and **Transshipment Hubs** (with flow conservation).
* **Directed Connections**: Draw routes between supply, transshipment, and demand nodes.
* **Draggable Cost Cards**: Click to edit unit transportation costs directly on the routes. Drag cost labels anywhere along the Bezier curves to organize your canvas layout.

### 2. Built-in LP Solver
* Formulates the visual network into a mathematical Linear Programming (LP) model on the fly.
* Solves the model client-side (using `javascript-lp-solver`) to find the cost-minimizing routing allocation.
* Animates active routes to visually show optimized flow volumes and dispatches.

### 3. Project Management Dashboard
* **Saved Projects List**: Served as the app landing page where you can manage multiple models.
* **Dynamic Previews**: Generates lightweight, static SVG thumbnails of each network layout on the project cards.
* **Operations**: Easily **Rename**, **Duplicate** (clone networks), or **Delete** models.
* **Search Filter**: Filter your models in real time with the quick-search utility.

### 4. High-Fidelity PDF Exporter
* Generates a multi-page optimization report.
* **Vector Graph Drawing**: Dynamically renders a clean, high-resolution diagram of the active canvas (including node types, names, route connections, unit costs, and flow volumes) directly in the PDF.
* **Statistical Analysis**: Details specifications, solver success metrics (Optimal or Infeasible diagnostics), and a clean table of active route dispatches.

### 5. Professional Editor Utilities
* **Undo / Redo Framework**: Multi-step transaction history stack with support for `Cmd/Ctrl + Z` and `Cmd/Ctrl + Y`.
* **Manual Saving & Warnings**: Status badges displaying `Saved` / `Unsaved Changes` with exit warnings on tab closing or back-navigation to prevent accidental data loss.
* **Segregated Interactivity Locking**: 
  * **Viewport Lock (Move Icon)**: Freezes canvas zooming and panning.
  * **Elements Lock (Padlock Icon)**: Disables node dragging, route connecting, name/quantity editing, and canvas clearing.

## 🛠️ Technology Stack

* **UI Library**: React (with functional hooks and TypeScript)
* **Build System**: Vite (configured with Tailwind v4 compiler)
* **Styling**: Tailwind CSS v4 (CSS-first configuration)
* **Network Canvas**: React Flow v12 (for nodes/edges manipulation)
* **Optimization Engine**: `javascript-lp-solver` (client-side simplex/revised solver)
* **PDF Exporter**: `jsPDF` (with HTML5 Canvas rendering)
* **Icon Set**: Lucide Icons

## 💻 Local Installation & Setup

1. **Clone the Repository**:
   ```bash
   git clone <your-github-repo-url>
   cd "LP-Optimization-Solver"
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Compile Production Build**:
   ```bash
   npm run build
   ```
4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173/` (or the port specified in your terminal).

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
