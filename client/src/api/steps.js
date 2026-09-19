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

export function wizardSteps(design) {
  const steps = ['name', 'context', 'design', 'workflows', 'rules'];
  if (design?.wantStories !== false) steps.push('stories');
  if (design?.wantCases !== false) {
    steps.push('testcases', 'export');
  }
  return steps;
}

export function stepPath(session) {
  if (!session?._id) return '/';
  const allowed = wizardSteps(session.design);
  let key = session.latestStep || session.step || 'name';
  if (!allowed.includes(key)) {
    key = allowed[allowed.length - 1] || 'name';
  }
  const fn = PATHS[key] || PATHS.name;
  return fn(session._id);
}

export function pathFor(id, step) {
  const fn = PATHS[step] || PATHS.name;
  return fn(id);
}

export function previousOf(current, design) {
  if (current === 'name') return { path: '/', step: null };
  if (current === 'canvas') return { path: (id) => PATHS.workflows(id), step: 'workflows' };
  const steps = wizardSteps(design);
  const key = canonicalStep(current);
  const i = steps.indexOf(key);
  if (i <= 0) return { path: '/', step: null };
  const step = steps[i - 1];
  return { path: (id) => PATHS[step](id), step };
}

export function nextOf(current, design) {
  const steps = wizardSteps(design);
  const key = canonicalStep(current);
  const i = steps.indexOf(key);
  if (i < 0 || i >= steps.length - 1) return null;
  const step = steps[i + 1];
  return { path: (id) => PATHS[step](id), step };
}

export function canGoForward(current, latestStep, design) {
  const next = nextOf(current, design);
  if (!next) return false;
  const allowed = wizardSteps(design);
  const latest = allowed.indexOf(latestStep || 'name');
  const target = allowed.indexOf(next.step);
  return target !== -1 && latest !== -1 && target <= latest;
}
