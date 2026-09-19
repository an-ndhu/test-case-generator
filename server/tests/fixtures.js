export const studioPayload = {
  workflows: [
    {
      title: 'Workflow 1',
      summary: 'Happy path',
      selected: true,
      graph: { nodes: [{ id: 'n1', label: 'Start', kind: 'start' }], edges: [] },
    },
  ],
  rules: [{ workflowIndex: 0, text: 'Must authenticate', explicit: true, selected: true }],
  userStories: [
    {
      workflowIndex: 0,
      title: 'As a user I log in',
      body: 'so that I can work',
      selected: true,
      linkedRuleIndexes: [0],
    },
  ],
  testCases: [
    {
      title: 'Login succeeds',
      type: 'positive',
      preconditions: 'Valid user',
      steps: ['Open login'],
      expected: 'Dashboard',
      selected: true,
      workflowIndex: 0,
    },
    {
      title: 'Login fails',
      type: 'negative',
      preconditions: 'Bad password',
      steps: ['Submit'],
      expected: 'Error',
      selected: false,
      workflowIndex: 0,
    },
  ],
};
