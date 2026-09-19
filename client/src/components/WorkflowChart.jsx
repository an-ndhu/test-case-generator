import { useMemo, useState } from 'react';
import { fallbackGraph, layoutGraph } from '../lib/workflowGraph';

export default function WorkflowChart({ workflow, rules = [] }) {
  const [zoom, setZoom] = useState(1);
  const graph = useMemo(() => {
    if (workflow?.graph?.nodes?.length) return workflow.graph;
    const related = rules.filter((r) => r.workflowIndex === workflow?._index).map((r) => r.text);
    return fallbackGraph(workflow?.title, related);
  }, [workflow, rules]);

  const pos = useMemo(() => layoutGraph(graph.nodes, graph.edges), [graph]);
  const width = Math.max(640, ...Object.values(pos).map((p) => p.x + 120));
  const height = Math.max(320, ...Object.values(pos).map((p) => p.y + 80));

  return (
    <div className="chart-shell">
      <svg className="graph" viewBox={`0 0 ${width} ${height}`} style={{ transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
        {graph.edges?.map((e, i) => {
          const a = pos[e.from];
          const b = pos[e.to];
          if (!a || !b) return null;
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#7c8cff"
              strokeWidth="2"
            />
          );
        })}
        {graph.nodes.map((n) => {
          const p = pos[n.id];
          if (!p) return null;
          const start = n.kind === 'start';
          const decision = n.kind === 'decision';
          return (
            <g key={n.id}>
              <rect
                x={p.x - 70}
                y={p.y - 28}
                width="140"
                height="56"
                rx="10"
                fill={start ? '#fce7f3' : decision ? '#e0e7ff' : '#eef2ff'}
                stroke={start ? '#f9a8d4' : '#c7d2fe'}
              />
              <text x={p.x} y={p.y - 4} textAnchor="middle" fontSize="10" fontWeight="700">
                {n.kind === 'start' ? 'Start' : decision ? 'Decision' : 'Workflow'}
              </text>
              <text x={p.x} y={p.y + 12} textAnchor="middle" fontSize="10">
                {n.label.length > 22 ? `${n.label.slice(0, 22)}…` : n.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="zoom-bar">
        <button type="button" className="btn" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>
          −
        </button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" className="btn" onClick={() => setZoom((z) => Math.min(1.5, z + 0.25))}>
          +
        </button>
      </div>
    </div>
  );
}
