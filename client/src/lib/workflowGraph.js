export function fallbackGraph(title, ruleTexts = []) {
  const extra = ruleTexts.slice(0, 3).map((t, i) => ({
    id: `r${i}`,
    label: String(t).slice(0, 32) || `Step ${i + 1}`,
    kind: 'step',
  }));
  const nodes = [
    { id: 'start', label: 'Start', kind: 'start' },
    { id: 'decision', label: title ? String(title).slice(0, 32) : 'Decision', kind: 'decision' },
    ...extra,
    { id: 'end', label: 'Complete', kind: 'step' },
  ];
  const edges = [];
  for (let i = 0; i < nodes.length - 1; i += 1) {
    edges.push({ from: nodes[i].id, to: nodes[i + 1].id });
  }
  return { nodes, edges };
}

export function layoutGraph(nodes = [], edges = []) {
  const incoming = Object.fromEntries(nodes.map((n) => [n.id, 0]));
  edges.forEach((e) => {
    if (incoming[e.to] !== undefined) incoming[e.to] += 1;
  });
  const children = Object.fromEntries(nodes.map((n) => [n.id, []]));
  edges.forEach((e) => {
    if (children[e.from]) children[e.from].push(e.to);
  });

  const levels = [];
  const seen = new Set();
  let frontier = nodes.filter((n) => !incoming[n.id]).map((n) => n.id);
  if (!frontier.length && nodes[0]) frontier = [nodes[0].id];

  while (frontier.length) {
    levels.push(frontier);
    frontier.forEach((id) => seen.add(id));
    const next = [];
    frontier.forEach((id) => {
      (children[id] || []).forEach((cid) => {
        if (!seen.has(cid) && !next.includes(cid)) next.push(cid);
      });
    });
    frontier = next;
  }

  nodes.forEach((n) => {
    if (!seen.has(n.id)) levels.push([n.id]);
  });

  const pos = {};
  const colW = 180;
  const rowH = 100;
  levels.forEach((col, x) => {
    col.forEach((id, y) => {
      pos[id] = { x: 90 + x * colW, y: 50 + y * rowH };
    });
  });
  return pos;
}
