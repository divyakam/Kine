/* ============================================================
   KINE — SVG Chart Engine
   Handles dynamic generation of smooth area/line charts
   ============================================================ */

const KINE_Charts = (() => {
  'use strict';

  /**
   * Generates a smooth cubic bezier path for a set of data points
   * @param {Array} data - Array of values (0-100)
   * @param {number} width - SVG viewBox width
   * @param {number} height - SVG viewBox height
   * @returns {string} SVG path 'd' attribute
   */
  function getPathData(data, width, height) {
    if (!data || data.length < 2) return "";

    const paddingY = 20;
    const paddingX = 12; // Horizontal padding for edge breathing room
    const effectiveHeight = height - paddingY * 2;
    const effectiveWidth = width - paddingX * 2;
    const xStep = effectiveWidth / (data.length - 1);

    const points = data.map((d, i) => ({
      x: paddingX + i * xStep,
      y: height - (paddingY + (d / 100) * effectiveHeight)
    }));

    // Start path
    let path = `M ${points[0].x},${points[0].y}`;

    // Quadratic curve approach for smoother "liquid" look
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i+1];
        
        // Control points for smoother transition
        const cp1x = p0.x + (p1.x - p0.x) / 2.5;
        const cp2x = p1.x - (p1.x - p0.x) / 2.5;

        path += ` C ${cp1x},${p0.y} ${cp2x},${p1.y} ${p1.x},${p1.y}`;
    }

    return path;
  }

  /**
   * Renders a trend chart into an existing SVG
   * @param {string} svgId - ID of the SVG element
   * @param {Array} data - Array of values (0-100)
   */
  function renderTrendChart(svgId, data) {
    const svg = document.getElementById(svgId);
    if (!svg) return;

    // Use viewBox dimensions
    const vb = svg.getAttribute('viewBox') || "0 0 400 160";
    const [,, width, height] = vb.split(' ').map(parseFloat);

    // --- Visual Axes and Grid ---
    let gridGroup = svg.querySelector('.chart-grid-lines');
    if (!gridGroup) {
      gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      gridGroup.setAttribute('class', 'chart-grid-lines');
      svg.insertBefore(gridGroup, svg.firstChild);
    }
    gridGroup.innerHTML = '';

    const levels = [0, 50, 100];
    const paddingY = 20;
    const paddingX = 12;
    const effectiveHeight = height - paddingY * 2;
    const effectiveWidth = width - paddingX * 2;

    levels.forEach(level => {
      const gy = height - (paddingY + (level / 100) * effectiveHeight);
      const gline = document.createElementNS("http://www.w3.org/2000/svg", "line");
      gline.setAttribute('x1', paddingX);
      gline.setAttribute('y1', gy);
      gline.setAttribute('x2', width - paddingX);
      gline.setAttribute('y2', gy);
      gline.setAttribute('stroke', 'var(--glass-border)');
      gline.setAttribute('stroke-opacity', '0.5');
      gline.setAttribute('stroke-width', '1');
      if (level > 0 && level < 100) {
        gline.setAttribute('stroke-dasharray', '4 4');
      }
      gridGroup.appendChild(gline);
    });

    // Vertical Axis Line
    const vy = document.createElementNS("http://www.w3.org/2000/svg", "line");
    vy.setAttribute('x1', paddingX); vy.setAttribute('y1', paddingY);
    vy.setAttribute('x2', paddingX); vy.setAttribute('y2', height - paddingY);
    vy.setAttribute('stroke', 'var(--glass-border)');
    vy.setAttribute('stroke-width', '1.5');
    gridGroup.appendChild(vy);

    // Horizontal Axis Line
    const hx = document.createElementNS("http://www.w3.org/2000/svg", "line");
    hx.setAttribute('x1', paddingX); hx.setAttribute('y1', height - paddingY);
    hx.setAttribute('x2', width - paddingX); hx.setAttribute('y2', height - paddingY);
    hx.setAttribute('stroke', 'var(--glass-border)');
    hx.setAttribute('stroke-width', '1.5');
    gridGroup.appendChild(hx);

    const pathData = getPathData(data, width, height);

    // Update data lines...
    const linePath = svg.querySelector('.chart-line');
    if (linePath) {
      linePath.setAttribute('d', pathData);
    }

    const areaPath = svg.querySelector('.chart-area');
    if (areaPath) {
      const closedPath = `${pathData} L ${width - paddingX},${height - paddingY} L ${paddingX},${height - paddingY} Z`;
      areaPath.setAttribute('d', closedPath);
    }

    const pointsGroup = svg.querySelector('.chart-points');
    if (pointsGroup) {
      pointsGroup.innerHTML = '';
      const xStep = effectiveWidth / (data.length - 1);
      const lastVal = data[data.length - 1];
      const cx = paddingX + (data.length - 1) * xStep;
      const cy = height - (paddingY + (lastVal / 100) * effectiveHeight);
      
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', 'var(--accent-primary)');
      circle.style.filter = 'drop-shadow(0 0 8px var(--accent-primary-dim))';
      pointsGroup.appendChild(circle);
    }
  }

  /**
   * Generates X-Axis labels
   * @param {string} containerId - ID of the labels container
   * @param {Array} labels - Array of strings (e.g., ['M', 'T', ...])
   */
  function renderLabels(containerId, labels) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Distribute labels and ensure they are legible
    container.innerHTML = labels.map(l => {
       // Optional: Shorten labels if they are too long (e.g., Afternoon -> Aft..)
       // const displayLabel = l.length > 8 ? l.substring(0, 3) + '.' : l;
       return `<span class="chart-label">${l}</span>`;
    }).join('');
  }

  /**
   * Renders Y-Axis markers into a container
   * @param {string} containerId - ID of the container element
   * @param {Array} markers - Values to display (top to bottom)
   */
  function renderYAxis(containerId, markers = ['100', '50', '0']) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.className = 'y-axis-labels';
    container.innerHTML = markers.map(m => `<span>${m}</span>`).join('');
  }

  return {
    renderTrendChart,
    renderLabels,
    renderYAxis
  };
})();

window.KINE_Charts = KINE_Charts;
