import request from 'supertest';
import { createApp } from '../src/app.js';

export function app() {
  return createApp();
}

export async function registerAgent(overrides = {}) {
  const agent = request.agent(app());
  const body = {
    name: 'Test User',
    email: `user-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
    password: 'password1',
    ...overrides,
  };
  const res = await agent.post('/api/auth/register').send(body);
  return { agent, user: res.body, res, body };
}
