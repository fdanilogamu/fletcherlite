(() => {
  const root = document.querySelector('[data-practice-map]');
  if (!root) return;

  const canvas = root.querySelector('[data-map-canvas]');
  const svg = root.querySelector('[data-map-svg]');
  const pathLayer = root.querySelector('[data-map-paths]');
  const junctionLayer = root.querySelector('[data-map-junctions]');
  const buttons = [...root.querySelectorAll('[data-select]')];
  const stages = ['investigate', 'recognize', 'design', 'question', 'evaluate', 'communicate'];
  const stageLabels = {
    investigate: 'Investigate', recognize: 'Recognize', design: 'Design',
    question: 'Question', evaluate: 'Evaluate', communicate: 'Communicate'
  };
  const stageDetails = {
    investigate: {
      eyebrow: 'Stage 01 · Central narrative', title: 'Investigate',
      paragraphs: [
        'I examine available material and its context. Inventories, source references, repository information, usage, and update indicators can help me decide what deserves closer attention. I may inspect a representative sample in depth, looking at references, links and images, sequence, repository fit, formatting, and procedural completeness.',
        'My judgment matters in deciding what to inspect, how deeply, and what evidence is relevant. Comparison material can provide context without automatically serving as a benchmark.',
        'For example, a procedure that appears complete at first may reveal missing prerequisites or implicit steps on closer reading.'
      ]
    },
    recognize: {
      eyebrow: 'Stage 02 · Central narrative', title: 'Recognize',
      paragraphs: [
        'I distinguish isolated defects from recurring issues and move between artifact-level observations and broader explanations. An interpretation is a hypothesis: evidence can change it, and a plausible explanation still needs to be examined.',
        'My judgment matters in deciding whether observations share an underlying cause and whether that explanation is supported. AI can assist with pattern extraction and problem articulation; it does not settle the conclusion.',
        'Several different gaps may point to a common problem, but the pattern needs checking against source material.'
      ]
    },
    design: {
      eyebrow: 'Stage 03 · Central narrative', title: 'Design',
      paragraphs: [
        'I consider whether an established practice addresses the issue, what can be adapted, or whether a different standard is needed. I weigh consequences for human comprehension, AI ingestion and retrieval, and operational reliability.',
        'Requirements address failures that materially compromise function, reliability, or usability; recommendations offer meaningful improvements without making their absence a fundamental failure.',
        'My judgment matters in weighing consequences, deciding what is essential, and preserving useful foundations when scope changes. AI can help explore possible approaches, while I remain accountable for the intervention.'
      ]
    },
    question: {
      eyebrow: 'Stage 04 · Central narrative', title: 'Question',
      paragraphs: [
        'Iterative questioning can surface decisions not yet formalized, such as ownership, approval conditions, timelines, or lifecycle handling. Reading can also expose a missing connection: I identify the question that would bridge it and determine whether I can answer it from my expertise or need further knowledge or assistance.',
        'My judgment matters in deciding which questions affect the system, what can responsibly be resolved, and what remains unsupported. This stage can change earlier understanding and redirect design.',
        'If a description depends on an unstated approval condition, identifying that missing decision may change what the material needs to explain.'
      ]
    },
    evaluate: {
      eyebrow: 'Stage 05 · Central narrative', title: 'Evaluate',
      paragraphs: [
        'I check whether evidence supports the interpretation, requirements reflect functional consequences, and explanations include necessary dependencies. I use comprehension as a diagnostic: a disrupted sequence or missing connection may signal an information or structural gap.',
        'Substantive assertions must pass two professional tests: I believe them from my expertise, and I can defend them from my expertise. I also review my work over time to see patterns and progress at a broader level.',
        'My judgment matters in deciding what is coherent and defensible, and what needs more investigation, revision, or removal. Evaluation is not just checking whether an activity is finished.'
      ]
    },
    communicate: {
      eyebrow: 'Stage 06 · Central narrative', title: 'Communicate',
      paragraphs: [
        'I connect investigation, findings, underlying problems, proposed interventions, and the reasons they matter. Different audiences may need different representations of the same work: authoritative technical material and decision-oriented explanation serve different purposes.',
        'My judgment matters in choosing what an audience needs to understand without losing the connection to evidence. AI can assist with language, production, simpler representations, and executive-facing presentations while professional ownership remains mine.',
        'A body of technical material may need a simpler audience-facing explanation that preserves the rationale behind the response.'
      ]
    }
  };

  const anchors = {
    ai: {
      title: 'AI involvement', eyebrow: 'Working relationship · Supporting capability',
      stages: ['recognize', 'design', 'question', 'evaluate', 'communicate'],
      paragraphs: [
        'AI can assist with pattern extraction, problem articulation, questioning, exploring possible approaches, language refinement, production, simpler representations, and executive-facing presentations.',
        'Its contribution varies by activity: substantial in Design and Question, supporting in Recognize, Evaluate, and Communicate. Its output remains subject to professional review. Plausibility alone is not grounds for endorsement.'
      ]
    },
    records: {
      title: 'Record-keeping', eyebrow: 'Ongoing practice',
      stages: ['investigate', 'recognize', 'evaluate', 'communicate'],
      paragraphs: [
        'I record observations and source information as work progresses, maintain a continuous daily log, and periodically review or aggregate those records.',
        'This keeps specific activities visible while helping me understand patterns and direction across the broader body of work. Source references also support an evidence trail connecting investigation to findings and communication.'
      ]
    },
    systemic: {
      title: 'Systemic Thinking', eyebrow: 'Cross-cutting way of understanding',
      stages,
      paragraphs: [
        'Systemic Thinking runs through the practice, but takes a different form at each stage. Select a stage in the map to see how it appears there.',
        'Investigate moves between artifacts, observations, and the wider environment. Recognize connects observations into patterns and underlying problems. Design considers how an intervention affects other parts of the system. Question surfaces dependencies, assumptions, missing relationships, and consequences. Evaluate tests whether the parts form a coherent whole. Communicate preserves the links between findings, the larger problem, and a response.'
      ]
    },
    'new-eyes': {
      title: 'Prepare for New Eyes', eyebrow: 'Audience orientation',
      stages: ['design', 'communicate'],
      paragraphs: [
        'I anticipate how someone unfamiliar with the material will encounter, understand, and use it.',
        'This orientation shapes how I design resulting material and how I communicate the same underlying work to different audiences. It informs presentation without weakening the function of the underlying requirements.'
      ]
    },
    governance: {
      title: 'Governance and risk', eyebrow: 'Decision considerations',
      stages: ['design', 'question', 'evaluate', 'communicate'],
      paragraphs: [
        'Governance and risk become significant considerations as I design responses to identified problems. Functional consequences help shape what a standard or requirement needs to address.',
        'These considerations continue through questions about ownership, approval conditions, cutoffs, eligibility, and lifecycle handling; evaluation of reliability and risk; and communication of decisions and implications.'
      ]
    },
    fletcher: {
      title: "Fletcher's role", eyebrow: 'Professional agency · Encompasses the whole system',
      stages,
      paragraphs: [
        'Accumulated expertise, pattern recognition, interpretation, professional judgment, intellectual ownership, and integration encompass the entire practice.',
        'Tools, including AI, can support analysis, exploration, and production. I remain responsible for conclusions, recommendations, and decisions, and accept substantive material only when I believe it from my expertise and can defend it from my expertise.'
      ]
    }
  };

  const stageToAnchors = Object.fromEntries(stages.map((stage) => [stage, []]));
  Object.entries(anchors).forEach(([id, anchor]) => {
    if (id === 'fletcher') return;
    anchor.stages.forEach((stage) => stageToAnchors[stage].push(id));
  });

  const detailEyebrow = root.querySelector('[data-detail-eyebrow]');
  const detailTitle = root.querySelector('[data-detail-title]');
  const detailCopy = root.querySelector('[data-detail-copy]');
  const resetButton = root.querySelector('[data-map-reset]');
  let activeSelection = null;

  const setDetail = (item) => {
    const detail = item === 'overview'
      ? {
          eyebrow: 'Overview', title: 'The whole practice',
          paragraphs: [
            'The sequence is a way into the work, not a fixed route. Evidence can change how I understand the problem, and questions may lead me back to earlier thinking. Systemic Thinking runs through every stage in a different way; Fletcher’s expertise and judgment encompass the whole.',
            'Select any stage or influence to explore its role. All connections remain visible in the map.'
          ]
        }
      : stageDetails[item] || anchors[item];

    detailEyebrow.textContent = detail.eyebrow;
    detailTitle.textContent = detail.title;
    detailCopy.replaceChildren(...detail.paragraphs.map((paragraph) => {
      const p = document.createElement('p');
      p.textContent = paragraph;
      return p;
    }));
  };

  const drawDiagram = () => {
    if (window.matchMedia('(max-width: 680px)').matches) return;
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

    const relatedStages = isOverview ? stages : (stageDetails[item] ? [item] : (anchors[item]?.stages || stages));
    const relatedAnchors = isOverview || item === 'fletcher' ? Object.keys(anchors).filter((id) => id !== 'fletcher') :
      stageDetails[item] ? stageToAnchors[item] : [item];
    root.querySelectorAll('[data-map-item]').forEach((element) => {
      const id = element.dataset.mapItem;
      element.classList.toggle('is-related', isOverview || relatedStages.includes(id) || relatedAnchors.includes(id));
    });
    root.querySelectorAll('[data-select]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.select === item));
    });
    pathLayer.querySelectorAll('[data-connection]').forEach((path) => {
      const id = path.dataset.connection;
      const matches = isOverview || (stageDetails[item] ? id === item || relatedAnchors.includes(id) : id === item || (item === 'fletcher'));
      path.classList.toggle('is-related', matches);
    });
    pathLayer.querySelectorAll('[data-from][data-to]').forEach((path) => {
      path.classList.toggle('is-related', isOverview || stageDetails[item] && (path.dataset.from === item || path.dataset.to === item) || item === 'fletcher');
    });
    pathLayer.querySelectorAll('[data-stage]').forEach((path) => path.classList.toggle('is-related', isOverview || relatedStages.includes(path.dataset.stage) || item === 'fletcher'));
    setDetail(item || 'overview');
  };

  buttons.forEach((button) => button.addEventListener('click', () => {
    const item = button.dataset.select;
    applySelection(activeSelection === item ? null : item);
  }));
  resetButton.addEventListener('click', () => applySelection(null));

  root.classList.add('is-enhanced');
  drawDiagram();
  applySelection(null);
  if ('ResizeObserver' in window) new ResizeObserver(drawDiagram).observe(canvas);
  window.addEventListener('resize', drawDiagram, { passive: true });
})();
