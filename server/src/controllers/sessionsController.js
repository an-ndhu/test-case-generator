import { extractText } from '../services/extractText.js';
import { assertAiConfigured, generateStudio } from '../services/geminiService.js';
import { Session } from '../models/Session.js';

const STEPS = ['name', 'context', 'design', 'workflows', 'rules', 'stories', 'testcases', 'export'];

async function owned(req) {
  const session = await Session.findOne({ _id: req.params.id, userId: req.userId });
  if (!session) {
    const err = new Error('Session not found.');
    err.status = 404;
    throw err;
  }
  return session;
}

function bumpLatest(session, step) {
  if (!STEPS.includes(step)) return;
  const cur = STEPS.indexOf(session.latestStep || 'name');
  const next = STEPS.indexOf(step);
  if (next > cur) session.latestStep = step;
}

function inferLatest(row) {
  let latest = row.latestStep || row.step || 'name';
  const generated = (row.workflows?.length || row.testCases?.length || 0) > 0;
  if (generated && STEPS.indexOf(latest) < STEPS.indexOf('workflows')) {
    latest = STEPS[Math.max(STEPS.indexOf(row.step || 'name'), STEPS.indexOf('workflows'))];
  }
  return latest;
}

function listItem(row) {
  return {
    _id: row._id,
    title: row.title,
    status: row.status,
    step: row.step,
    latestStep: inferLatest(row),
    updatedAt: row.updatedAt,
    caseCount: row.testCases?.length || 0,
  };
}

export async function createSession(req, res, next) {
  try {
    const title = String(req.body.title || req.body.requirementText || 'Untitled project')
      .trim()
      .slice(0, 80) || 'Untitled project';
    const note = String(req.body.requirementText || req.body.contextNote || '').trim();

    const session = await Session.create({
      userId: req.userId,
      title,
      requirementText: note,
      contextNote: note,
      step: 'name',
      latestStep: 'name',
      status: 'draft',
    });

    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

export async function listSessions(req, res, next) {
  try {
    const rows = await Session.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .select('title status step latestStep updatedAt testCases')
      .lean();
    res.json(rows.map(listItem));
  } catch (err) {
    next(err);
  }
}

export async function getSession(req, res, next) {
  try {
    const session = await owned(req);
    const json = session.toObject();
    json.latestStep = inferLatest(json);
    res.json(json);
  } catch (err) {
    next(err);
  }
}

export async function updateSession(req, res, next) {
  try {
    const session = await owned(req);
    const body = req.body || {};

    if (typeof body.title === 'string' && body.title.trim()) {
      session.title = body.title.trim().slice(0, 80);
    }
    if (typeof body.contextNote === 'string') session.contextNote = body.contextNote;
    if (typeof body.requirementText === 'string') session.requirementText = body.requirementText;
    if (body.step && STEPS.includes(body.step)) {
      session.step = body.step;
      bumpLatest(session, body.step);
    }
    if (body.design && typeof body.design === 'object') {
      session.design = { ...session.design.toObject?.() || session.design, ...body.design };
    }
    if (Array.isArray(body.workflows)) session.workflows = body.workflows;
    if (Array.isArray(body.rules)) session.rules = body.rules;
    if (Array.isArray(body.userStories)) session.userStories = body.userStories;
    if (Array.isArray(body.testCases)) session.testCases = body.testCases;

    await session.save();
    res.json(session);
  } catch (err) {
    next(err);
  }
}

export async function deleteSession(req, res, next) {
  try {
    const session = await owned(req);
    await session.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function addFile(req, res, next) {
  try {
    const session = await owned(req);
    if (!req.file) {
      const err = new Error('Attach a .txt or .md file.');
      err.status = 400;
      throw err;
    }
    const text = extractText(req.file);
    session.files.push({ name: req.file.originalname, text });
    session.sourceFileName = req.file.originalname;
    if (!session.contextNote) session.contextNote = text;
    await session.save();
    res.json(session);
  } catch (err) {
    next(err);
  }
}

async function runStudio(session) {
  assertAiConfigured();
  session.status = 'generating';
  session.errorMessage = '';
  await session.save();

  try {
    const payload = await generateStudio(session);
    session.workflows = payload.workflows;
    session.rules = payload.rules;
    session.userStories = payload.userStories;
    session.testCases = payload.testCases;
    session.status = 'ready';
    session.step = 'workflows';
    bumpLatest(session, 'workflows');
    session.errorMessage = '';
  } catch (err) {
    session.status = 'failed';
    session.errorMessage = err.message || 'Generation failed.';
    await session.save();
    throw err;
  }

  await session.save();
  return session;
}

export async function generateSession(req, res, next) {
  try {
    const session = await owned(req);
    const ready = await runStudio(session);
    res.json(ready);
  } catch (err) {
    next(err);
  }
}

export async function regenerateSession(req, res, next) {
  try {
    const session = await owned(req);
    const ready = await runStudio(session);
    res.json(ready);
  } catch (err) {
    next(err);
  }
}

export async function exportCsv(req, res, next) {
  try {
    const session = await owned(req);
    const rows = (session.testCases || []).filter((c) => c.selected !== false);
    const esc = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
    const header = 'title,type,preconditions,steps,expected';
    const lines = rows.map((c) =>
      [c.title, c.type, c.preconditions, (c.steps || []).join(' | '), c.expected].map(esc).join(',')
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${session.title.replace(/\W+/g, '_')}.csv"`);
    res.send([header, ...lines].join('\n'));
  } catch (err) {
    next(err);
  }
}
