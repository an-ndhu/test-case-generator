import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import request from 'supertest';
import { studioPayload } from './fixtures.js';

const generateStudio = jest.fn();
const assertAiConfigured = jest.fn();

jest.unstable_mockModule('../src/services/geminiService.js', () => ({
  assertAiConfigured,
  generateStudio,
}));

const { createApp } = await import('../src/app.js');

function app() {
  return createApp();
}

async function authAgent(overrides) {
  const agent = request.agent(app());
  const body = {
    name: 'Test User',
    email: `user-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
    password: 'password1',
    ...overrides,
  };
  const res = await agent.post('/api/auth/register').send(body);
  return { agent, user: res.body, body };
}

describe('sessions', () => {
  beforeEach(() => {
    generateStudio.mockReset();
    assertAiConfigured.mockReset();
    generateStudio.mockImplementation(async (session) => {
      const payload = structuredClone(studioPayload);
      if (session.design?.wantStories === false) payload.userStories = [];
      if (session.design?.wantCases === false) payload.testCases = [];
      return payload;
    });
  });

  describe('positive', () => {
    it('creates a session and stores requirement text as context', async () => {
      const { agent } = await authAgent();
      const res = await agent.post('/api/sessions').send({ requirementText: 'Login flow' });
      expect(res.status).toBe(201);
      expect(res.body.contextNote).toBe('Login flow');
      expect(res.body.title).toBe('Login flow');
    });

    it('lists only the current user sessions', async () => {
      const a = await authAgent();
      const b = await authAgent();
      await a.agent.post('/api/sessions').send({ title: 'A project' });
      await b.agent.post('/api/sessions').send({ title: 'B project' });

      const listA = await a.agent.get('/api/sessions');
      expect(listA.status).toBe(200);
      expect(listA.body).toHaveLength(1);
      expect(listA.body[0].title).toBe('A project');
    });

    it('gets and patches title, step, design, rules, and files', async () => {
      const { agent } = await authAgent();
      const created = await agent.post('/api/sessions').send({ title: 'Patch me' });
      const id = created.body._id;

      const patched = await agent.patch(`/api/sessions/${id}`).send({
        title: 'Patched',
        step: 'design',
        design: { category: 'Functional', wantStories: false },
        rules: [{ text: 'A rule', explicit: true, selected: true, workflowIndex: 0 }],
        files: [{ name: 'n.txt', text: 'notes' }],
      });
      expect(patched.status).toBe(200);
      expect(patched.body.title).toBe('Patched');
      expect(patched.body.step).toBe('design');
      expect(patched.body.design.wantStories).toBe(false);
      expect(patched.body.rules[0].text).toBe('A rule');
      expect(patched.body.files[0].name).toBe('n.txt');

      const got = await agent.get(`/api/sessions/${id}`);
      expect(got.body.title).toBe('Patched');
    });

    it('deletes a session', async () => {
      const { agent } = await authAgent();
      const created = await agent.post('/api/sessions').send({ title: 'Gone' });
      const del = await agent.delete(`/api/sessions/${created.body._id}`);
      expect(del.status).toBe(200);
      const got = await agent.get(`/api/sessions/${created.body._id}`);
      expect(got.status).toBe(404);
    });

    it('uploads .txt and .md files', async () => {
      const { agent } = await authAgent();
      const created = await agent.post('/api/sessions').send({ title: 'Files' });
      const id = created.body._id;

      const txt = await agent
        .post(`/api/sessions/${id}/files`)
        .attach('file', Buffer.from('plain text'), { filename: 'a.txt', contentType: 'text/plain' });
      expect(txt.status).toBe(200);
      expect(txt.body.files[0].text).toBe('plain text');

      const md = await agent
        .post(`/api/sessions/${id}/files`)
        .attach('file', Buffer.from('# Hello'), { filename: 'b.md', contentType: 'text/markdown' });
      expect(md.status).toBe(200);
      expect(md.body.files).toHaveLength(2);
    });

    it('exports CSV for selected test cases only', async () => {
      const { agent } = await authAgent();
      const created = await agent.post('/api/sessions').send({ title: 'Export' });
      const id = created.body._id;
      await agent.patch(`/api/sessions/${id}`).send({
        testCases: studioPayload.testCases,
      });

      const csv = await agent.get(`/api/sessions/${id}/export.csv`);
      expect(csv.status).toBe(200);
      expect(csv.text).toMatch(/Login succeeds/);
      expect(csv.text).not.toMatch(/Login fails/);
    });

    it('generate and regenerate store mocked artifacts and set step workflows', async () => {
      const { agent } = await authAgent();
      const created = await agent.post('/api/sessions').send({ title: 'Gen', contextNote: 'ctx' });
      const id = created.body._id;

      const gen = await agent.post(`/api/sessions/${id}/generate`);
      expect(gen.status).toBe(200);
      expect(gen.body.step).toBe('workflows');
      expect(gen.body.workflows).toHaveLength(1);
      expect(generateStudio).toHaveBeenCalled();

      const regen = await agent.post(`/api/sessions/${id}/regenerate`);
      expect(regen.status).toBe(200);
      expect(regen.body.step).toBe('workflows');
    });

    it('generate honors wantStories and wantCases false', async () => {
      const { agent } = await authAgent();
      const created = await agent.post('/api/sessions').send({ title: 'Flags' });
      const id = created.body._id;
      await agent.patch(`/api/sessions/${id}`).send({
        design: { wantStories: false, wantCases: false },
      });

      const gen = await agent.post(`/api/sessions/${id}/generate`);
      expect(gen.status).toBe(200);
      expect(gen.body.userStories).toEqual([]);
      expect(gen.body.testCases).toEqual([]);
      expect(gen.body.workflows.length).toBeGreaterThan(0);
    });
  });

  describe('negative', () => {
    it('rejects unauthenticated session create', async () => {
      const res = await request(app()).post('/api/sessions').send({ title: 'Nope' });
      expect(res.status).toBe(401);
    });

    it('returns 404 for unknown session ids', async () => {
      const { agent } = await authAgent();
      const missing = new mongoose.Types.ObjectId().toString();
      expect((await agent.get(`/api/sessions/${missing}`)).status).toBe(404);
      expect((await agent.patch(`/api/sessions/${missing}`).send({ title: 'x' })).status).toBe(404);
      expect((await agent.delete(`/api/sessions/${missing}`)).status).toBe(404);
    });

    it('returns 404 for an invalid ObjectId', async () => {
      const { agent } = await authAgent();
      const res = await agent.get('/api/sessions/not-an-id');
      expect(res.status).toBe(404);
    });

    it('does not let user B read user A session', async () => {
      const a = await authAgent();
      const b = await authAgent();
      const created = await a.agent.post('/api/sessions').send({ title: 'Secret' });
      const res = await b.agent.get(`/api/sessions/${created.body._id}`);
      expect(res.status).toBe(404);
    });

    it('rejects upload with no file', async () => {
      const { agent } = await authAgent();
      const created = await agent.post('/api/sessions').send({ title: 'F' });
      const res = await agent.post(`/api/sessions/${created.body._id}/files`);
      expect(res.status).toBe(400);
    });

    it('rejects a non txt/md upload', async () => {
      const { agent } = await authAgent();
      const created = await agent.post('/api/sessions').send({ title: 'F' });
      const res = await agent
        .post(`/api/sessions/${created.body._id}/files`)
        .attach('file', Buffer.from('%PDF'), { filename: 'x.pdf', contentType: 'application/pdf' });
      expect(res.status).toBe(400);
    });

    it('rejects an empty file', async () => {
      const { agent } = await authAgent();
      const created = await agent.post('/api/sessions').send({ title: 'F' });
      const res = await agent
        .post(`/api/sessions/${created.body._id}/files`)
        .attach('file', Buffer.from('   '), { filename: 'empty.txt', contentType: 'text/plain' });
      expect(res.status).toBe(400);
    });

    it('rejects a file over 1MB', async () => {
      const { agent } = await authAgent();
      const created = await agent.post('/api/sessions').send({ title: 'F' });
      const res = await agent
        .post(`/api/sessions/${created.body._id}/files`)
        .attach('file', Buffer.alloc(1024 * 1024 + 20, 97), {
          filename: 'big.txt',
          contentType: 'text/plain',
        });
      expect(res.status).toBe(400);
    });
  });
});
