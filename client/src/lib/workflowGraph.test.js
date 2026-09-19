import { fallbackGraph, layoutGraph } from './workflowGraph';

describe('workflowGraph', () => {
  describe('positive', () => {
    it('builds a fallback graph with start and end', () => {
      const graph = fallbackGraph('Login', ['Must auth']);
      expect(graph.nodes[0]).toMatchObject({ id: 'start', kind: 'start' });
      expect(graph.nodes[graph.nodes.length - 1].id).toBe('end');
      expect(graph.edges.length).toBeGreaterThan(0);
    });

    it('assigns x/y for laid-out nodes', () => {
      const graph = fallbackGraph('Login');
      const pos = layoutGraph(graph.nodes, graph.edges);
      expect(pos.start).toEqual(expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }));
      expect(pos.end).toBeDefined();
    });
  });

  describe('negative', () => {
    it('does not throw on empty nodes and edges', () => {
      expect(() => layoutGraph([], [])).not.toThrow();
      expect(layoutGraph([], [])).toEqual({});
    });
  });
});
