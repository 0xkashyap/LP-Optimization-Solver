import { jsPDF } from 'jspdf';
import type { Project } from '../types/network';
import { solveTransportation } from '../solver/transportationSolver';

// Helper to calculate coordinates along a cubic Bezier or straight line
function getEdgePoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rSource: number,
  rTarget: number
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);

  if (len === 0) return { startX: x1, startY: y1, endX: x2, endY: y2, ux: 0, uy: 0 };

  const ux = dx / len;
  const uy = dy / len;

  return {
    startX: x1 + ux * rSource,
    startY: y1 + uy * rSource,
    endX: x2 - ux * rTarget,
    endY: y2 - uy * rTarget,
    ux,
    uy,
  };
}

export function exportProjectToPdf(project: Project) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const { name, nodes, edges } = project;
  const dateStr = new Date(project.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate totals
  const supplyCount = nodes.filter((n) => n.type === 'supply').length;
  const demandCount = nodes.filter((n) => n.type === 'demand').length;
  const transshipmentCount = nodes.filter((n) => n.type === 'transshipment').length;

  // Run solver to get current solution status and allocations
  const solverResult = solveTransportation(nodes, edges);

  // --- 1. Page Header ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Operations Research Solver Report', 15, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175); // slate-400
  doc.text(`Model: ${name}`, 15, 24);
  doc.text(`Generated: ${dateStr}`, 15, 30);

  // --- 2. Summary Statistics Block ---
  doc.setTextColor(51, 65, 85); // slate-700
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. Network Specifications', 15, 48);

  // Stats Grid
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(15, 52, 180, 22, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.rect(15, 52, 180, 22, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Supply Sources', 25, 60);
  doc.text('Transshipments', 65, 60);
  doc.text('Demand Sinks', 110, 60);
  doc.text('Active Routes', 155, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${supplyCount} nodes`, 25, 66);
  doc.text(`${transshipmentCount} hubs`, 65, 66);
  doc.text(`${demandCount} nodes`, 110, 66);
  doc.text(`${edges.length} connections`, 155, 66);

  // --- 3. Render Visual Graph to Image & Draw ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. Visual Network Graph', 15, 84);

  // Draw graph on a hidden canvas
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');

  if (ctx && nodes.length > 0) {
    // Fill canvas background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid dots
    ctx.fillStyle = '#e2e8f0';
    for (let gx = 0; gx < canvas.width; gx += 40) {
      for (let gy = 0; gy < canvas.height; gy += 40) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Scale coords
    const xCoords = nodes.map((n) => n.position.x);
    const yCoords = nodes.map((n) => n.position.y);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);

    const xRange = maxX - minX;
    const yRange = maxY - minY;

    const padX = 120;
    const padY = 80;
    const drawW = canvas.width - 2 * padX;
    const drawH = canvas.height - 2 * padY;

    const scaleX = (x: number) => {
      if (xRange === 0) return canvas.width / 2;
      return padX + ((x - minX) / xRange) * drawW;
    };

    const scaleY = (y: number) => {
      if (yRange === 0) return canvas.height / 2;
      return padY + ((y - minY) / yRange) * drawH;
    };

    const nodeRadius = 24;

    // Draw connection edges
    edges.forEach((edge) => {
      const src = nodes.find((n) => n.id === edge.source);
      const tgt = nodes.find((n) => n.id === edge.target);
      if (!src || !tgt) return;

      const x1 = scaleX(src.position.x);
      const y1 = scaleY(src.position.y);
      const x2 = scaleX(tgt.position.x);
      const y2 = scaleY(tgt.position.y);

      // Shorten line so arrows don't clip
      const { startX, startY, endX, endY, ux, uy } = getEdgePoints(
        x1,
        y1,
        x2,
        y2,
        nodeRadius,
        nodeRadius
      );

      const flow = solverResult.allocations[edge.id] ?? 0;
      const isRouteActive = solverResult.status === 'optimal' && flow > 0;

      // Draw connection line
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = isRouteActive ? '#10b981' : '#cbd5e1';
      ctx.lineWidth = isRouteActive ? 5 : 2.5;
      ctx.stroke();

      // Draw arrowhead
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      const arrowSize = 14;
      // Perpendicular vector
      const px = -uy;
      const py = ux;
      ctx.lineTo(endX - ux * arrowSize + px * 6, endY - uy * arrowSize + py * 6);
      ctx.lineTo(endX - ux * arrowSize - px * 6, endY - uy * arrowSize - py * 6);
      ctx.closePath();
      ctx.fillStyle = isRouteActive ? '#10b981' : '#94a3b8';
      ctx.fill();

      // Draw cost label on route
      const mx = (startX + endX) / 2;
      const my = (startY + endY) / 2;

      // Label background card
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = isRouteActive ? '#10b981' : '#e2e8f0';
      ctx.lineWidth = 1.5;
      const labelW = isRouteActive ? 90 : 60;
      const labelH = 28;
      ctx.beginPath();
      ctx.roundRect(mx - labelW / 2, my - labelH / 2, labelW, labelH, 6);
      ctx.fill();
      ctx.stroke();

      // Label texts
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (isRouteActive) {
        ctx.fillText(`Cost: ${edge.data?.cost}  |  Flow: ${flow}`, mx, my);
      } else {
        ctx.fillText(`Cost: ${edge.data?.cost}`, mx, my);
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      const cx = scaleX(node.position.x);
      const cy = scaleY(node.position.y);

      let themeColor = '#9333ea'; // purple for transshipment
      if (node.type === 'supply') themeColor = '#4f46e5'; // indigo
      else if (node.type === 'demand') themeColor = '#10b981'; // emerald

      // Draw node glow outer border
      ctx.beginPath();
      ctx.arc(cx, cy, nodeRadius + 3, 0, 2 * Math.PI);
      ctx.fillStyle = themeColor + '1a'; // 10% opacity
      ctx.fill();

      // Draw node circle
      ctx.beginPath();
      ctx.arc(cx, cy, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = themeColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw Node text initials
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.id, cx, cy);

      // Draw Node Name
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(node.data.name, cx, cy - (nodeRadius + 6));

      // Draw Node Quantity below it
      if (node.type !== 'transshipment') {
        const qtyLabel = node.type === 'supply' ? `Supply: ${node.data.quantity}` : `Demand: ${node.data.quantity}`;
        ctx.fillStyle = '#64748b'; // slate-500
        ctx.font = 'bold 11px sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillText(qtyLabel, cx, cy + (nodeRadius + 6));
      }
    });

    const imgData = canvas.toDataURL('image/png');
    doc.rect(15, 88, 180, 90, 'S'); // border around graph
    doc.addImage(imgData, 'PNG', 15, 88, 180, 90);
  } else {
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 88, 180, 40, 'F');
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(10);
    doc.text('No nodes present to draw graph representation.', 60, 110);
  }

  // --- 4. Solver Solution Output Section ---
  const yOffset = 188;
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('3. Optimization Analysis', 15, yOffset);

  // Status Indicator
  let statusBgColor = [241, 245, 249]; // grey
  let statusTextColor = [100, 116, 139];
  let statusText = 'Ready to Solve / Unsolved';

  if (solverResult.status === 'optimal') {
    statusBgColor = [209, 250, 229]; // emerald-100
    statusTextColor = [6, 95, 70]; // emerald-800
    statusText = 'Optimal Solution Reached';
  } else if (solverResult.status === 'infeasible') {
    statusBgColor = [254, 226, 226]; // red-100
    statusTextColor = [153, 27, 27]; // red-800
    statusText = 'Infeasible Problem Structure';
  }

  doc.setFillColor(statusBgColor[0], statusBgColor[1], statusBgColor[2]);
  doc.rect(15, yOffset + 4, 180, 10, 'F');
  doc.setTextColor(statusTextColor[0], statusTextColor[1], statusTextColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(statusText.toUpperCase(), 20, yOffset + 10.5);

  if (solverResult.status === 'optimal') {
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Min-Cost Value Summary:', 15, yOffset + 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(`Total Optimal Flow Cost:`, 20, yOffset + 28);
    doc.setFont('helvetica', 'bold');
    doc.text(`$${solverResult.totalCost.toLocaleString()}`, 80, yOffset + 28);

    doc.setFont('helvetica', 'normal');
    doc.text(`Total Outflow Volume:`, 20, yOffset + 34);
    doc.setFont('helvetica', 'bold');
    doc.text(`${solverResult.totalSupply} units`, 80, yOffset + 34);

    // --- Page 2: Route Allocations Breakdown ---
    doc.addPage();
    
    // Page 2 header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Route Allocation Table', 15, 10.5);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(12);
    doc.text('4. Route Routing & Dispatches', 15, 26);

    // Draw Table Headers
    const tableY = 32;
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(15, tableY, 180, 8, 'F');
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.line(15, tableY, 195, tableY);
    doc.line(15, tableY + 8, 195, tableY + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text('Source Node', 20, tableY + 5.5);
    doc.text('Destination Node', 70, tableY + 5.5);
    doc.text('Flow Transported', 120, tableY + 5.5);
    doc.text('Unit Cost', 155, tableY + 5.5);
    doc.text('Total Cost', 178, tableY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);

    let rowY = tableY + 8;
    let alternate = false;

    edges.forEach((edge) => {
      const flow = solverResult.allocations[edge.id] ?? 0;
      if (flow === 0) return;

      const srcNode = nodes.find((n) => n.id === edge.source);
      const tgtNode = nodes.find((n) => n.id === edge.target);
      const srcName = srcNode?.data.name || edge.source;
      const tgtName = tgtNode?.data.name || edge.target;
      const cost = edge.data?.cost || 0;
      const routeTotal = flow * cost;

      if (alternate) {
        doc.setFillColor(248, 250, 252); // subtle row bg
        doc.rect(15, rowY, 180, 7.5, 'F');
      }

      doc.text(`${srcName} (${edge.source})`, 20, rowY + 5);
      doc.text(`${tgtName} (${edge.target})`, 70, rowY + 5);
      doc.text(`${flow} units`, 120, rowY + 5);
      doc.text(`$${cost}`, 155, rowY + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${routeTotal}`, 178, rowY + 5);
      doc.setFont('helvetica', 'normal');

      rowY += 7.5;
      doc.setDrawColor(241, 245, 249);
      doc.line(15, rowY, 195, rowY);
      alternate = !alternate;
    });

    // Summary bottom border
    doc.setDrawColor(203, 213, 225);
    doc.line(15, rowY, 195, rowY);

    // Total Cost Row
    rowY += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Optimized Grand Total:', 120, rowY + 5);
    doc.text(`$${solverResult.totalCost.toLocaleString()}`, 178, rowY + 5);
  } else if (solverResult.status === 'infeasible') {
    doc.setTextColor(185, 28, 28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Infeasibility Diagnosis:', 15, yOffset + 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text('This transportation problem contains no feasible solution. Possible causes:', 20, yOffset + 28);
    doc.text('- The cumulative supply capacity at the sources is less than the total demand sinks requirement.', 25, yOffset + 35);
    doc.text('- One or more demand nodes do not have any directed routes leading to them.', 25, yOffset + 41);
    doc.text('- The transshipment hubs have flow conservation enabled, but do not have outgoing or incoming links.', 25, yOffset + 47);
  } else {
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('The model has not been solved yet. Please solve the model to generate flow results.', 20, yOffset + 22);
  }

  // Save the document
  const fileName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_report.pdf`;
  doc.save(fileName);
}
