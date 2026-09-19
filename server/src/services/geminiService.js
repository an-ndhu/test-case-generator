import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `You are a senior QA engineer. Read the software requirement or user story and produce a focused set of test cases.

Cover these dimensions whenever they apply: positive (happy path), negative (invalid or unauthorized), edge (boundaries, empty, max, concurrency), and validation (format, required fields, constraints).

Write 6–8 cases for a typical story. Use fewer only if the requirement is very small. Stay faithful to the given text — do not invent unrelated product areas.

Return JSON only, matching:
{
  "testCases": [
    {
      "title": "short, specific title",
      "type": "positive" | "negative" | "edge" | "validation",
      "preconditions": "what must be true before the test",
      "steps": ["step 1", "step 2"],
      "expected": "observable expected result"
    }
  ]
}`;

const ALLOWED_TYPES = new Set(['positive', 'negative', 'edge', 'validation']);

function getApiKey() {
  const key = String(process.env.GEMINI_API_KEY || '')
    .trim()
    .replace(/^["']|["']$/g, '');
  if (!key || key.includes('your-key')) {
    const err = new Error('GEMINI_API_KEY is not set. Add it to the root .env file.');
    err.status = 503;
    throw err;
  }
  return key;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function statusOf(err) {
  return Number(err?.status) || Number(err?.statusCode) || 0;
}

function isQuotaError(err) {
  const msg = String(err?.message || '');
  return /quota|billing|exceeded your current/i.test(msg) && !/rate/i.test(msg);
}

function isRateLimit(err) {
  const msg = String(err?.message || '');
  return statusOf(err) === 429 || /RESOURCE_EXHAUSTED|Too Many Requests|rate.?limit/i.test(msg);
}

function retryWaitMs(attempt) {
  return Math.min(1000 * 2 ** attempt, 12_000);
}

async function callGemini(prompt, { system = SYSTEM_PROMPT, maxOutputTokens = 2500 } = {}) {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: system,
      temperature: 0.4,
      maxOutputTokens,
      responseMimeType: 'application/json',
    },
  });
  const text = String(response.text || '').trim();
  if (!text) {
    const err = new Error('Gemini returned an empty response.');
    err.status = 502;
    throw err;
  }
  return text;
}

async function generateJson(prompt, opts) {
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await callGemini(prompt, opts);
    } catch (err) {
      lastErr = err;
      if (isRateLimit(err) && !isQuotaError(err) && attempt < 3) {
        await sleep(retryWaitMs(attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

function wrapAiError(err) {
  const alreadyMapped =
    err.name === 'Error' &&
    err.status &&
    !err.error &&
    !/googleapis\.com|API_KEY_INVALID|UNAUTHENTICATED/i.test(err.message || '');
  if (alreadyMapped) return err;

  console.error('Gemini error', statusOf(err), err.message);

  if (isQuotaError(err)) {
    const wrapped = new Error(
      'Gemini says this key is out of quota. Check usage in Google AI Studio, then try again.'
    );
    wrapped.status = 402;
    return wrapped;
  }

  if (isRateLimit(err)) {
    const wrapped = new Error('The AI provider is rate-limiting us. Wait a moment and try again.');
    wrapped.status = 429;
    return wrapped;
  }

  if (
    statusOf(err) === 400 ||
    statusOf(err) === 401 ||
    statusOf(err) === 403 ||
    /API_KEY_INVALID|API key|UNAUTHENTICATED|ACCESS_TOKEN_TYPE_UNSUPPORTED/i.test(err.message || '')
  ) {
    const wrapped = new Error(
      'The Gemini API key was rejected. In AI Studio click Copy key, paste it into GEMINI_API_KEY in the root .env, then restart the API.'
    );
    wrapped.status = 401;
    return wrapped;
  }

  const wrapped = new Error(`AI generation failed: ${err.message || 'unknown error'}`);
  wrapped.status = 502;
  return wrapped;
}

function normalizeCases(raw) {
  const list = Array.isArray(raw?.testCases) ? raw.testCases : [];
  return list
    .filter((c) => c && typeof c.title === 'string' && c.title.trim())
    .map((c) => ({
      title: String(c.title).trim(),
      type: ALLOWED_TYPES.has(c.type) ? c.type : 'positive',
      preconditions: String(c.preconditions || '').trim(),
      steps: Array.isArray(c.steps)
        ? c.steps.map((s) => String(s).trim()).filter(Boolean)
        : [],
      expected: String(c.expected || '').trim(),
    }));
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Model did not return JSON.');
    return JSON.parse(match[0]);
  }
}

export function assertAiConfigured() {
  getApiKey();
}

export async function generateTestCases(requirementText) {
  const run = async (extraUserNote = '') => {
    const prompt = extraUserNote
      ? `${extraUserNote}\n\nRequirement:\n${requirementText}`
      : `Requirement:\n${requirementText}`;
    return normalizeCases(parseJson(await generateJson(prompt)));
  };

  try {
    let cases = await run();
    if (!cases.length) {
      cases = await run('Return valid JSON with a non-empty testCases array only.');
    }
    if (!cases.length) {
      const err = new Error('The model returned no usable test cases. Try regenerating.');
      err.status = 502;
      throw err;
    }
    return cases;
  } catch (err) {
    throw wrapAiError(err);
  }
}

const STUDIO_PROMPT = `You are a senior QA architect. From the project context, produce a compact test-engineering package as JSON only.

Return:
{
  "workflows": [
    {
      "title": "string",
      "summary": "2-3 sentences",
      "graph": {
        "nodes": [{ "id": "n1", "label": "short", "kind": "start|decision|step" }],
        "edges": [{ "from": "n1", "to": "n2" }]
      }
    }
  ],
  "rules": [{ "workflowIndex": 0, "text": "testable rule", "explicit": true }],
  "userStories": [{ "workflowIndex": 0, "title": "As a ...", "body": "so that ...", "linkedRuleIndexes": [0] }],
  "testCases": [{
    "title": "string",
    "type": "positive|negative|edge|validation",
    "preconditions": "string",
    "steps": ["step"],
    "expected": "string",
    "explicit": true
  }]
}

Limits: 3-5 workflows, 8-12 rules, 4-8 user stories, 6-10 test cases.
Each workflow graph: 4-7 nodes and matching edges.
Stay faithful to the given context. If format is bdd or bdd2, write test case steps in Gherkin-style Given/When/Then.`;

function normalizeStudio(raw) {
  const workflows = Array.isArray(raw.workflows) ? raw.workflows : [];
  const rules = Array.isArray(raw.rules) ? raw.rules : [];
  const stories = Array.isArray(raw.userStories) ? raw.userStories : [];

  return {
    workflows: workflows.slice(0, 5).map((w, i) => ({
      title: String(w.title || `Workflow ${i + 1}`).trim(),
      summary: String(w.summary || '').trim(),
      selected: true,
      graph: {
        nodes: Array.isArray(w.graph?.nodes)
          ? w.graph.nodes.map((n, j) => ({
              id: String(n.id || `n${j}`),
              label: String(n.label || 'Step').trim(),
              kind: String(n.kind || 'step'),
            }))
          : [],
        edges: Array.isArray(w.graph?.edges)
          ? w.graph.edges.map((e) => ({ from: String(e.from || ''), to: String(e.to || '') }))
          : [],
      },
    })),
    rules: rules.slice(0, 12).map((r) => ({
      workflowIndex: Number.isInteger(r.workflowIndex) ? r.workflowIndex : 0,
      text: String(r.text || '').trim(),
      explicit: r.explicit !== false,
      selected: true,
    })).filter((r) => r.text),
    userStories: stories.slice(0, 8).map((s) => ({
      workflowIndex: Number.isInteger(s.workflowIndex) ? s.workflowIndex : 0,
      title: String(s.title || 'User story').trim(),
      body: String(s.body || '').trim(),
      selected: true,
      linkedRuleIndexes: Array.isArray(s.linkedRuleIndexes) ? s.linkedRuleIndexes.map(Number) : [],
    })),
    testCases: normalizeCases(raw).slice(0, 10).map((c) => ({ ...c, selected: true, explicit: true })),
  };
}

function fallbackGraph(title, ruleTexts = []) {
  const extra = ruleTexts.slice(0, 3).map((t, i) => ({
    id: `r${i}`,
    label: String(t).slice(0, 28) || `Step ${i + 1}`,
    kind: 'step',
  }));
  const nodes = [
    { id: 'start', label: 'Start', kind: 'start' },
    { id: 'decision', label: title ? String(title).slice(0, 28) : 'Decision', kind: 'decision' },
    ...extra,
    { id: 'end', label: 'Complete', kind: 'step' },
  ];
  const edges = [];
  for (let i = 0; i < nodes.length - 1; i += 1) {
    edges.push({ from: nodes[i].id, to: nodes[i + 1].id });
  }
  if (extra.length > 1) {
    edges.push({ from: 'decision', to: extra[extra.length - 1].id });
  }
  return { nodes, edges };
}

function ensureGraphs(payload) {
  payload.workflows = payload.workflows.map((w, i) => {
    if (w.graph?.nodes?.length) return w;
    const related = payload.rules.filter((r) => r.workflowIndex === i).map((r) => r.text);
    return { ...w, graph: fallbackGraph(w.title, related) };
  });
  return payload;
}

export async function generateStudio(session) {
  const format = session.design?.format || 'standard';
  const files = (session.files || []).map((f) => `File ${f.name}:\n${f.text}`).join('\n\n');
  const prompt = [
    `Project: ${session.title}`,
    `Format: ${format}`,
    session.design?.category ? `Technique category: ${session.design.category}` : '',
    session.design?.technique ? `Technique: ${session.design.technique}` : '',
    `Want test cases: ${session.design?.wantCases !== false}`,
    `Want user stories: ${session.design?.wantStories !== false}`,
    `Context:\n${session.contextNote || session.requirementText || '(none)'}`,
    files ? `\n${files}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    let payload = ensureGraphs(normalizeStudio(parseJson(await generateJson(prompt, { system: STUDIO_PROMPT, maxOutputTokens: 8192 }))));
    if (!payload.workflows.length && !payload.testCases.length) {
      payload = ensureGraphs(normalizeStudio(
        parseJson(await generateJson(`${prompt}\n\nReturn a non-empty JSON object as specified.`, { system: STUDIO_PROMPT, maxOutputTokens: 8192 }))
      ));
    }
    if (!payload.workflows.length && !payload.testCases.length) {
      const err = new Error('The model returned no usable artifacts. Try regenerating.');
      err.status = 502;
      throw err;
    }
    return payload;
  } catch (err) {
    throw wrapAiError(err);
  }
}
