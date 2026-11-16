(() => {
  const root = document.querySelector('[data-practice-map]');
  if (!root) return;

  const canvas = root.querySelector('[data-map-canvas]');
  const svg = root.querySelector('[data-map-svg]');
  const pathLayer = root.querySelector('[data-map-paths]');
  const junctionLayer = root.querySelector('[data-map-junctions]');
  const buttons = [...root.querySelectorAll('[data-select]')];
  const stages = ['investigate', 'recognize', 'design', 'question', 'evaluate', 'communicate'];
  const anchors = {
    ai: { stages: ['recognize', 'design', 'question', 'evaluate', 'communicate'] },
    fletcher: { stages },
    records: { stages: ['investigate', 'recognize', 'evaluate', 'communicate'] },
    systemic: { stages },
    'new-eyes': { stages: ['design', 'communicate'] },
    governance: { stages: ['design', 'question', 'evaluate', 'communicate'] }
  };

  const stageToAnchors = Object.fromEntries(stages.map((stage) => [stage, []]));
  Object.entries(anchors).forEach(([id, anchor]) => {
    if (id === 'fletcher') return;
    anchor.stages.forEach((stage) => stageToAnchors[stage].push(id));
  });

  const popup = root.querySelector('[data-map-popup]');
  const popupEyebrow = root.querySelector('[data-popup-eyebrow]');
  const popupTitle = root.querySelector('[data-popup-title]');
  const popupCopy = root.querySelector('[data-popup-copy]');
  const popupClose = root.querySelector('[data-popup-close]');
  const popupEntryLink = root.querySelector('[data-popup-entry-link]');
  const resetButton = root.querySelector('[data-map-reset]');
  const explained = document.querySelector('.map-explained details');
  const explainedContent = document.querySelector('.map-explained-content');
  let activeSelection = null;
  let activeTrigger = null;
  let suppressFocusPreview = null;
  let highlightedEntry = null;

  const positionPopup = () => {
    if (popup.hidden || !activeTrigger) return;
    const canvasRect = canvas.getBoundingClientRect();
    const triggerRect = activeTrigger.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    const gap = 12;
    const maxLeft = Math.max(gap, canvas.clientWidth - popupRect.width - gap);
    const maxTop = Math.max(gap, canvas.clientHeight - popupRect.height - gap);
    const right = triggerRect.right - canvasRect.left + gap;
    const left = triggerRect.left - canvasRect.left - popupRect.width - gap;
    let x = right <= maxLeft ? right : (left >= gap ? left : triggerRect.left - canvasRect.left + (triggerRect.width - popupRect.width) / 2);
    let y = triggerRect.top - canvasRect.top + (triggerRect.height - popupRect.height) / 2;
    if (window.matchMedia('(max-width: 680px)').matches) {
      x = triggerRect.left - canvasRect.left + (triggerRect.width - popupRect.width) / 2;
      y = triggerRect.bottom - canvasRect.top + gap;
      if (y > maxTop) y = triggerRect.top - canvasRect.top - popupRect.height - gap;
    }
    popup.style.left = `${Math.max(gap, Math.min(x, maxLeft))}px`;
    popup.style.top = `${Math.max(gap, Math.min(y, maxTop))}px`;
  };

  const setPopup = (item) => {
    const heading = document.getElementById(item);
    const entry = heading?.closest('[data-map-entry]');
    const description = entry?.querySelector('[data-module-description]');
    if (!entry || !description) {
      popup.hidden = true;
      return;
    }
    popupEyebrow.textContent = entry.dataset.mapEyebrow;
    popupTitle.textContent = heading.textContent;
    popupCopy.replaceChildren(description.cloneNode(true));
    popupEntryLink.href = `#${heading.id}`;
    popup.hidden = false;
    positionPopup();
  };

  const closePopup = ({ returnFocus = false } = {}) => {
    const trigger = activeTrigger;
    popup.hidden = true;
    activeTrigger = null;
    buttons.forEach((button) => button.setAttribute('aria-expanded', 'false'));
    if (returnFocus && trigger) {
      suppressFocusPreview = trigger;
      trigger.focus();
    }
  };

  const scrollToEntry = (id, { updateHistory = true, focus = true } = {}) => {
    const heading = document.getElementById(id);
    const entry = heading?.closest('[data-map-entry]');
    if (!entry) return;
    highlightedEntry?.classList.remove('is-arrival');
    highlightedEntry = entry;
    highlightedEntry.classList.add('is-arrival');
    explained.open = true;
    if (updateHistory) history.pushState(null, '', `#${heading.id}`);
    requestAnimationFrame(() => {
      heading.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      if (focus) heading.focus({ preventScroll: true });
    });
  };

  const scrollToMap = () => {
    explained.open = false;
    history.pushState(null, '', '#practice-map');
    root.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };

  const drawDiagram = () => {
    if (window.matchMedia('(max-width: 680px)').matches) {
      positionPopup();
      return;
    }
    const canvasRect = canvas.getBoundingClientRect();
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const localCenter = (element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.left - canvasRect.left + rect.width / 2, y: rect.top - canvasRect.top + rect.height / 2 };
    };
    const boundary = root.querySelector('[data-map-boundary] rect');
    boundary.setAttribute('x', '8');
    boundary.setAttribute('y', '8');
    boundary.setAttribute('width', String(Math.max(width - 16, 0)));
    boundary.setAttribute('height', String(Math.max(height - 16, 0)));
    root.querySelectorAll('.map-blueprint-grid').forEach((gridRect) => {
      gridRect.setAttribute('width', String(width));
      gridRect.setAttribute('height', String(height));
    });

    const stageButtons = Object.fromEntries(stages.map((id) => [id, root.querySelector(`[data-select="${id}"]`)]));
    const anchorButtons = Object.fromEntries(Object.keys(anchors).filter((id) => id !== 'fletcher').map((id) => [id, root.querySelector(`[data-select="${id}"]`)]));
    const points = {};
    stages.forEach((id) => { points[id] = localCenter(stageButtons[id]); });
    Object.entries(anchorButtons).forEach(([id, element]) => { points[id] = localCenter(element); });

    const connect = (fromId, toId, id, kind, offset = 0) => {
      const from = points[fromId];
      const to = points[toId];
      const fromEl = fromId === 'fletcher' ? null : root.querySelector(`[data-map-item="${fromId}"]`);
      const toEl = root.querySelector(`[data-map-item="${toId}"]`);
      const fromBox = fromEl?.getBoundingClientRect();
      const toBox = toEl?.getBoundingClientRect();
      const startX = fromBox && from.x < to.x ? fromBox.right - canvasRect.left : fromBox ? fromBox.left - canvasRect.left : from.x;
      const endX = toBox && from.x < to.x ? toBox.left - canvasRect.left : toBox ? toBox.right - canvasRect.left : to.x;
      const midX = (startX + endX) / 2 + offset;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${startX} ${from.y} H ${midX} V ${to.y} H ${endX}`);
      path.setAttribute('class', `map-connection map-connection--${kind}`);
      path.dataset.connection = id;
      path.dataset.generated = 'true';
      pathLayer.append(path);
      const junction = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      junction.setAttribute('cx', midX);
      junction.setAttribute('cy', to.y);
      junction.setAttribute('r', '3.2');
      junction.dataset.connection = id;
      junction.dataset.generated = 'true';
      junctionLayer.append(junction);
    };

    pathLayer.querySelectorAll('[data-generated="true"], .map-connection:not([data-generated]), .map-sequence-path:not([data-generated])').forEach((path) => path.remove());
    junctionLayer.replaceChildren();

    // Keep the sequence rail outside the stage text, with a small leader to each stage.
    const firstStageRect = stageButtons[stages[0]].getBoundingClientRect();
    const railX = firstStageRect.left - canvasRect.left - 10;
    stages.forEach((id, index) => {
      const stageRect = stageButtons[id].getBoundingClientRect();
      const stageLeft = stageRect.left - canvasRect.left;
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      tick.setAttribute('class', 'map-sequence-path');
      tick.dataset.generated = 'true';
      tick.dataset.stage = id;
      tick.setAttribute('d', `M ${railX} ${points[id].y} H ${stageLeft}`);
      pathLayer.append(tick);
      if (index < stages.length - 1) {
        const next = stages[index + 1];
        const segment = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        segment.setAttribute('class', 'map-sequence-path');
        segment.dataset.generated = 'true';
        segment.dataset.from = id;
        segment.dataset.to = next;
        segment.setAttribute('d', `M ${railX} ${points[id].y} V ${points[next].y}`);
        pathLayer.append(segment);
      }
    });

    Object.entries(anchors).forEach(([id, anchor]) => {
      if (id === 'fletcher') return;
      anchor.stages.forEach((stage) => {
        const kind = id === 'ai' ? (['design', 'question'].includes(stage) ? 'substantial' : 'supporting') : id;
        const offset = id === 'systemic' ? 0 : (id.length % 2 ? 7 : -7);
        connect(id, stage, id, kind, offset);
      });
    });

  };

  const applySelection = (item) => {
    activeSelection = item;
    const isOverview = item === null;
    root.classList.toggle('has-selection', !isOverview);
    root.dataset.selection = item || 'overview';
    resetButton.setAttribute('aria-pressed', String(isOverview));

    const isStage = stages.includes(item);
    const relatedStages = isOverview ? stages : (isStage ? [item] : (anchors[item]?.stages || stages));
    const relatedAnchors = isOverview || item === 'fletcher' ? Object.keys(anchors).filter((id) => id !== 'fletcher') :
      isStage ? stageToAnchors[item] : [item];
    root.querySelectorAll('[data-map-item]').forEach((element) => {
      const id = element.dataset.mapItem;
      element.classList.toggle('is-related', isOverview || relatedStages.includes(id) || relatedAnchors.includes(id));
    });
    root.querySelectorAll('[data-select]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.select === item));
      button.setAttribute('aria-expanded', 'false');
    });
    pathLayer.querySelectorAll('[data-connection]').forEach((path) => {
      const id = path.dataset.connection;
      const matches = isOverview || (isStage ? relatedAnchors.includes(id) : id === item || item === 'fletcher');
      path.classList.toggle('is-related', matches);
    });
    pathLayer.querySelectorAll('[data-from][data-to]').forEach((path) => {
      path.classList.toggle('is-related', isOverview || isStage && (path.dataset.from === item || path.dataset.to === item) || item === 'fletcher');
    });
    pathLayer.querySelectorAll('[data-stage]').forEach((path) => path.classList.toggle('is-related', isOverview || relatedStages.includes(path.dataset.stage) || item === 'fletcher'));
    closePopup();
  };

  buttons.forEach((button) => {
    const showPreview = () => {
      if (suppressFocusPreview === button) {
        suppressFocusPreview = null;
        return;
      }
      activeTrigger = button;
      button.setAttribute('aria-expanded', 'true');
      setPopup(button.dataset.select);
    };
    button.addEventListener('pointerenter', showPreview);
    button.addEventListener('focus', showPreview);
    button.addEventListener('pointerleave', (event) => {
      if (!popup.contains(event.relatedTarget) && document.activeElement !== button) closePopup();
    });
    button.addEventListener('blur', (event) => {
      if (!popup.contains(event.relatedTarget)) closePopup();
    });
    button.addEventListener('click', () => {
      const item = button.dataset.select;
      applySelection(item);
      scrollToEntry(item);
    });
  });
  resetButton.addEventListener('click', () => applySelection(null));
  popupClose.addEventListener('click', () => closePopup({ returnFocus: true }));
  popupEntryLink.addEventListener('click', (event) => {
    event.preventDefault();
    const item = activeTrigger?.dataset.select || activeSelection;
    closePopup();
    if (item) scrollToEntry(item);
  });
  popup.addEventListener('pointerleave', (event) => {
    if (!activeTrigger || document.activeElement === activeTrigger || activeTrigger.contains(event.relatedTarget)) return;
    closePopup();
  });
  explainedContent.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const id = decodeURIComponent(link.getAttribute('href').slice(1));
    if (link.hasAttribute('data-map-return')) {
      event.preventDefault();
      scrollToMap();
      return;
    }
    if (document.getElementById(id)?.closest('[data-map-entry]')) {
      event.preventDefault();
      scrollToEntry(id);
    }
  });
  document.addEventListener('pointerdown', (event) => {
    if (!popup.hidden && !popup.contains(event.target) && !event.target.closest('[data-select]')) closePopup();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !popup.hidden) closePopup({ returnFocus: true });
  });

  root.classList.add('is-enhanced');
  drawDiagram();
  applySelection(null);
  const initialHash = decodeURIComponent(window.location.hash.slice(1));
  if (document.getElementById(initialHash)?.closest('[data-map-entry]')) {
    explained.open = true;
    const initialHeading = document.getElementById(initialHash);
    highlightedEntry = initialHeading.closest('[data-map-entry]');
    highlightedEntry.classList.add('is-arrival');
    requestAnimationFrame(() => initialHeading.scrollIntoView({ block: 'start' }));
  }
  if ('ResizeObserver' in window) new ResizeObserver(drawDiagram).observe(canvas);
  window.addEventListener('resize', drawDiagram, { passive: true });
})();
