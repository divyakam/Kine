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

    const padding = 10;
    const effectiveHeight = height - padding * 2;
    const xStep = width / (data.length - 1);

    const points = data.map((d, i) => ({
      x: i * xStep,
      y: height - (padding + (d / 100) * effectiveHeight)
    }));

    let path = `M ${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i+1];
        const cp1x = p0.x + (p1.x - p0.x) / 2;
        const cp1y = p0.y;
        const cp2x = p0.x + (p1.x - p0.x) / 2;
        const cp2y = p1.y;

        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`;
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

    const viewBox = svg.getAttribute('viewBox').split(' ');
    const width = parseFloat(viewBox[2]);
    const height = parseFloat(viewBox[3]);

    const pathData = getPathData(data, width, height);

    // Update line path
    const linePath = svg.querySelector('.chart-line');
    if (linePath) linePath.setAttribute('d', pathData);

    // Update area path (closed shape)
    const areaPath = svg.querySelector('.chart-area');
    if (areaPath) {
      const closedPath = `${pathData} L ${width},${height} L 0,${height} Z`;
      areaPath.setAttribute('d', closedPath);
    }

    // Update circles (points)
    const pointsGroup = svg.querySelector('.chart-points');
    if (pointsGroup) {
      pointsGroup.innerHTML = '';
      const xStep = width / (data.length - 1);
      const padding = 10;
      const effectiveHeight = height - padding * 2;

      data.forEach((val, i) => {
        const cx = i * xStep;
        const cy = height - (padding + (val / 100) * effectiveHeight);
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', 'var(--chart-point)');
        pointsGroup.appendChild(circle);
      });
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

    container.innerHTML = labels.map(l => `<span class="chart-label">${l}</span>`).join('');
  }

  return {
    renderTrendChart,
    renderLabels
  };
})();

window.KINE_Charts = KINE_Charts;
