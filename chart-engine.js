/* ============================================================
   KINE — Advanced SVG Chart Engine (Obsidian Pulse Edition)
   Handles dynamic generation of cinematic, smooth-curved data 
   visualizations with high-end glow effects and entrance logic.
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

    const paddingY = 25;
    const paddingX = 16;
    const effectiveHeight = height - paddingY * 2;
    const effectiveWidth = width - paddingX * 2;
    const xStep = effectiveWidth / (data.length - 1);

    const points = data.map((d, i) => ({
      x: paddingX + i * xStep,
      y: height - (paddingY + (d / 100) * effectiveHeight)
    }));

    // Start path
    let path = `M ${points[0].x},${points[0].y}`;

    // Cubic curve approach for a "fluid" architectural look
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i+1];
        const cp1x = p0.x + (p1.x - p0.x) / 2;
        path += ` C ${cp1x},${p0.y} ${cp1x},${p1.y} ${p1.x},${p1.y}`;
    }

    return path;
  }

  /**
   * Renders a trend chart with high-end visual effects
   * @param {string} svgId - ID of the SVG element
   * @param {Array} data - Array of values (0-100)
   */
  function renderTrendChart(svgId, data) {
    const svg = document.getElementById(svgId);
    if (!svg) return;

    // Use viewBox dimensions
    const vb = svg.getAttribute('viewBox') || "0 0 400 160";
    const [,, width, height] = vb.split(' ').map(parseFloat);
    const paddingY = 25;
    const paddingX = 16;

    // --- 1. Prepare SVG Structure ---
    svg.innerHTML = `
      <defs>
        <linearGradient id="areaGrad-${svgId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--accent-primary)" stop-opacity="0.25" />
          <stop offset="100%" stop-color="var(--accent-primary)" stop-opacity="0" />
        </linearGradient>
        <filter id="glow-${svgId}">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <g class="chart-grid"></g>
      <path class="chart-area" fill="url(#areaGrad-${svgId})" />
      <path class="chart-line" fill="none" stroke="var(--accent-primary)" stroke-width="2.5" stroke-linecap="round" filter="url(#glow-${svgId})" />
      <g class="chart-points"></g>
    `;

    const grid = svg.querySelector('.chart-grid');
    const area = svg.querySelector('.chart-area');
    const line = svg.querySelector('.chart-line');
    const pointsGroup = svg.querySelector('.chart-points');

    // --- 2. Render Grid ---
    const levels = [0, 50, 100];
    const effectiveHeight = height - paddingY * 2;
    const effectiveWidth = width - paddingX * 2;

    levels.forEach(level => {
      const gy = height - (paddingY + (level / 100) * effectiveHeight);
      const gline = document.createElementNS("http://www.w3.org/2000/svg", "line");
      gline.setAttribute('x1', paddingX);
      gline.setAttribute('y1', gy);
      gline.setAttribute('x2', width - paddingX);
      gline.setAttribute('y2', gy);
      gline.setAttribute('stroke', 'rgba(255,255,255,0.05)');
      gline.setAttribute('stroke-width', '1');
      if (level === 0) gline.setAttribute('stroke', 'rgba(255,255,255,0.1)');
      grid.appendChild(gline);
    });

    // --- 3. Render Paths ---
    const pathData = getPathData(data, width, height);
    line.setAttribute('d', pathData);

    const closedPath = `${pathData} L ${width - paddingX},${height - paddingY} L ${paddingX},${height - paddingY} Z`;
    area.setAttribute('d', closedPath);

    // --- 4. Render Points (Animated Glow) ---
    const xStep = effectiveWidth / (data.length - 1);
    data.forEach((val, i) => {
      const cx = paddingX + i * xStep;
      const cy = height - (paddingY + (val / 100) * effectiveHeight);

      // Point core
      const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      point.setAttribute('cx', cx);
      point.setAttribute('cy', cy);
      point.setAttribute('r', '3');
      point.setAttribute('fill', 'var(--accent-primary)');
      pointsGroup.appendChild(point);

      // Pulse ring for last point
      if (i === data.length - 1) {
        const pulse = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pulse.setAttribute('cx', cx);
        pulse.setAttribute('cy', cy);
        pulse.setAttribute('r', '3');
        pulse.setAttribute('fill', 'none');
        pulse.setAttribute('stroke', 'var(--accent-primary)');
        pulse.setAttribute('stroke-width', '1');
        pointsGroup.appendChild(pulse);

        anime({
          targets: pulse,
          r: [3, 10],
          opacity: [0.8, 0],
          duration: 1500,
          loop: true,
          easing: 'easeOutSine'
        });
      }
    });

    // --- 5. Entrance Animation ---
    const lineLen = line.getTotalLength();
    line.setAttribute('stroke-dasharray', lineLen);
    line.setAttribute('stroke-dashoffset', lineLen);

    anime({
      targets: line,
      strokeDashoffset: [lineLen, 0],
      duration: 2000,
      easing: 'easeInOutQuart'
    });

    anime({
      targets: area,
      opacity: [0, 1],
      duration: 2500,
      easing: 'easeOutQuad'
    });
  }

  return {
    renderTrendChart
  };
})();

window.KINE_Charts = KINE_Charts;
