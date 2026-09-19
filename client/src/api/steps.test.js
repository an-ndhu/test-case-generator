import {
  canGoForward,
  canonicalStep,
  nextOf,
  previousOf,
  stepPath,
  wizardSteps,
} from './steps';

describe('wizardSteps', () => {
  it('includes stories, testcases, and export by default', () => {
    expect(wizardSteps()).toEqual([
      'name',
      'context',
      'design',
      'workflows',
      'rules',
      'stories',
      'testcases',
      'export',
    ]);
  });

  it('skips stories when wantStories is false', () => {
    expect(wizardSteps({ wantStories: false })).toEqual([
      'name',
      'context',
      'design',
      'workflows',
      'rules',
      'testcases',
      'export',
    ]);
  });

  it('ends at stories when wantCases is false', () => {
    expect(wizardSteps({ wantCases: false })).toEqual([
      'name',
      'context',
      'design',
      'workflows',
      'rules',
      'stories',
    ]);
  });

  it('ends at rules when both flags are false', () => {
    expect(wizardSteps({ wantStories: false, wantCases: false })).toEqual([
      'name',
      'context',
      'design',
      'workflows',
      'rules',
    ]);
  });
});

describe('stepPath', () => {
  it('uses latestStep when allowed', () => {
    expect(stepPath({ _id: 'abc', latestStep: 'rules' })).toBe('/projects/abc/rules');
  });

  it('returns / without an id', () => {
    expect(stepPath({})).toBe('/');
    expect(stepPath(null)).toBe('/');
  });
});

describe('nextOf / previousOf / canGoForward', () => {
  it('canonicalizes canvas to workflows', () => {
    expect(canonicalStep('canvas')).toBe('workflows');
    expect(nextOf('canvas').step).toBe('rules');
    expect(previousOf('canvas').step).toBe('workflows');
  });

  it('returns null at the last step', () => {
    expect(nextOf('export')).toBeNull();
    expect(nextOf('rules', { wantStories: false, wantCases: false })).toBeNull();
  });

  it('previous of name goes home', () => {
    expect(previousOf('name')).toEqual({ path: '/', step: null });
  });

  it('allows forward only when latestStep has reached the next step', () => {
    expect(canGoForward('design', 'workflows')).toBe(true);
    expect(canGoForward('design', 'design')).toBe(false);
    expect(canGoForward('export', 'export')).toBe(false);
  });
});
