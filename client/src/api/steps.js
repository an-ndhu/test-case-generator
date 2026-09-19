export const STEP_ORDER = ['name', 'context', 'design', 'workflows', 'rules', 'stories', 'testcases', 'export'];

const PATHS = {
  name: (id) => `/projects/${id}/name`,
  context: (id) => `/projects/${id}/context`,
  design: (id) => `/projects/${id}/design`,
  workflows: (id) => `/projects/${id}/workflows`,
  rules: (id) => `/projects/${id}/rules`,
  stories: (id) => `/projects/${id}/stories`,
  testcases: (id) => `/projects/${id}/test-cases`,
  export: (id) => `/projects/${id}/export`,
};

export function canonicalStep(current) {
  return current === 'canvas' ? 'workflows' : current;
}

export function stepPath(session) {
  if (!session?._id) return '/';
  const key = session.latestStep || session.step || 'name';
  const fn = PATHS[key] || PATHS.name;
  return fn(session._id);
}

export function previousOf(current) {
  const map = {
    name: { path: '/', step: null },
    context: { path: (id) => PATHS.name(id), step: 'name' },
    design: { path: (id) => PATHS.context(id), step: 'context' },
    workflows: { path: (id) => PATHS.design(id), step: 'design' },
    canvas: { path: (id) => PATHS.workflows(id), step: 'workflows' },
    rules: { path: (id) => PATHS.workflows(id), step: 'workflows' },
    stories: { path: (id) => PATHS.rules(id), step: 'rules' },
    testcases: { path: (id) => PATHS.stories(id), step: 'stories' },
    export: { path: (id) => PATHS.testcases(id), step: 'testcases' },
  };
  return map[current];
}

export function nextOf(current) {
  const map = {
    name: { path: (id) => PATHS.context(id), step: 'context' },
    context: { path: (id) => PATHS.design(id), step: 'design' },
    design: { path: (id) => PATHS.workflows(id), step: 'workflows' },
    workflows: { path: (id) => PATHS.rules(id), step: 'rules' },
    canvas: { path: (id) => PATHS.rules(id), step: 'rules' },
    rules: { path: (id) => PATHS.stories(id), step: 'stories' },
    stories: { path: (id) => PATHS.testcases(id), step: 'testcases' },
    testcases: { path: (id) => PATHS.export(id), step: 'export' },
  };
  return map[current];
}

export function canGoForward(current, latestStep) {
  const next = nextOf(current);
  if (!next) return false;
  const latest = STEP_ORDER.indexOf(latestStep || 'name');
  const target = STEP_ORDER.indexOf(next.step);
  return target !== -1 && target <= latest;
}
