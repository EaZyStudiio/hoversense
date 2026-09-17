/**
 * HoverSense DX Playground - 2x3 Staggered Rack Component
 *
 * Renders an asymmetric 2-column by 3-row layout with an exaggerated vertical offset.
 * Offloads card scaling and mobile portrait peeking directly to CSS custom properties.
 */

import { MOCK_PROJECTS } from './data.js';

export function renderRack(containerEl, onSelectUnit) {
  if (!containerEl) return;
  containerEl.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'rack-grid-2x3';

  // Split into 2 columns for asymmetric vertical rhythm
  const col1 = document.createElement('div');
  col1.className = 'rack-col';
  col1.id = 'rack-col-1';

  const col2 = document.createElement('div');
  col2.className = 'rack-col rack-col-offset';
  col2.id = 'rack-col-2';

  MOCK_PROJECTS.forEach((project, index) => {
    const isCol2 = index % 2 === 1;
    const card = document.createElement('article');
    card.className = 'unit-item hs-item';
    card.setAttribute('data-hs-item', '');
    card.setAttribute('data-hs-id', project.id);
    card.style.setProperty('--unit-accent', project.accent);

    card.innerHTML = `
      <div class="unit-head">
        <span class="unit-id mono">${project.id} // ${project.client.toUpperCase()}</span>
        <div class="unit-status mono">
          <span class="status-dot"></span>
          <span>${project.status}</span>
        </div>
      </div>

      <h3 class="unit-title">${project.title}</h3>
      <p class="unit-sub">${project.subtitle}</p>

      <div class="unit-tags mono">
        ${project.tags.map(t => `<span class="unit-tag">${t}</span>`).join('')}
      </div>

      <!-- Mobile Portrait Peek: Hidden by default, reveals via --hs-strength -->
      <div class="mobile-peek">
        <img src="${project.image}" alt="${project.title}" loading="lazy" />
        <span class="peek-badge mono">TELEMETRY PREV</span>
      </div>
    `;

    card.addEventListener('click', () => {
      if (onSelectUnit) onSelectUnit(project);
    });

    if (isCol2) {
      col2.appendChild(card);
    } else {
      col1.appendChild(card);
    }
  });

  grid.appendChild(col1);
  grid.appendChild(col2);
  containerEl.appendChild(grid);
}

export function setColumnOffset(offsetPx) {
  const col2 = document.getElementById('rack-col-2');
  if (col2) {
    col2.style.marginTop = `${offsetPx}px`;
  }
}
