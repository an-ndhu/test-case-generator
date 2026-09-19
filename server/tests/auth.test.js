import request from 'supertest';
import { app, registerAgent } from './helpers.js';

describe('auth', () => {
  describe('positive', () => {
    it('registers and sets an httpOnly cookie', async () => {
      const { res, user } = await registerAgent({ email: 'new@example.com' });
      expect(res.status).toBe(201);
      expect(user.email).toBe('new@example.com');
      expect(user.passwordHash).toBeUndefined();
      expect(res.headers['set-cookie']?.join(';')).toMatch(/melo_token=/);
    });

    it('logs in an existing user', async () => {
      const { body } = await registerAgent({ email: 'login@example.com', password: 'password1' });
      const res = await request(app()).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'password1',
      });
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(body.email);
    });

    it('returns the current user on GET /me', async () => {
      const { agent, user } = await registerAgent();
      const res = await agent.get('/api/auth/me');
      expect(res.status).toBe(200);
      expect(res.body._id).toBe(user._id);
    });

    it('changes password then allows login with the new password', async () => {
      const { agent, body } = await registerAgent({ email: 'pw@example.com', password: 'password1' });
      const changed = await agent.patch('/api/auth/password').send({
        currentPassword: 'password1',
        newPassword: 'password2',
      });
      expect(changed.status).toBe(200);

      const oldLogin = await request(app()).post('/api/auth/login').send({
        email: body.email,
        password: 'password1',
      });
      expect(oldLogin.status).toBe(401);

      const newLogin = await request(app()).post('/api/auth/login').send({
        email: body.email,
        password: 'password2',
      });
      expect(newLogin.status).toBe(200);
    });

    it('logout clears the cookie', async () => {
      const { agent } = await registerAgent();
      const res = await agent.post('/api/auth/logout');
      expect(res.status).toBe(200);
      const me = await agent.get('/api/auth/me');
      expect(me.status).toBe(401);
    });
  });

  describe('negative', () => {
    it('rejects register without a name', async () => {
      const res = await request(app()).post('/api/auth/register').send({
        name: '',
        email: 'a@example.com',
        password: 'password1',
      });
      expect(res.status).toBe(400);
    });

    it('rejects invalid email', async () => {
      const res = await request(app()).post('/api/auth/register').send({
        name: 'A',
        email: 'not-an-email',
        password: 'password1',
      });
      expect(res.status).toBe(400);
    });

    it('rejects short passwords', async () => {
      const res = await request(app()).post('/api/auth/register').send({
        name: 'A',
        email: 'a@example.com',
        password: 'short',
      });
      expect(res.status).toBe(400);
    });

    it('rejects duplicate email', async () => {
      await registerAgent({ email: 'dup@example.com' });
      const res = await request(app()).post('/api/auth/register').send({
        name: 'B',
        email: 'dup@example.com',
        password: 'password1',
      });
      expect(res.status).toBe(409);
    });

    it('rejects wrong login password', async () => {
      await registerAgent({ email: 'bad@example.com', password: 'password1' });
      const res = await request(app()).post('/api/auth/login').send({
        email: 'bad@example.com',
        password: 'wrongpass',
      });
      expect(res.status).toBe(401);
    });

    it('rejects GET /me without a cookie', async () => {
      const res = await request(app()).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('rejects PATCH /password without a cookie', async () => {
      const res = await request(app()).patch('/api/auth/password').send({
        currentPassword: 'password1',
        newPassword: 'password2',
      });
      expect(res.status).toBe(401);
    });

    it('rejects change password with the wrong current password', async () => {
      const { agent } = await registerAgent();
      const res = await agent.patch('/api/auth/password').send({
        currentPassword: 'not-the-password',
        newPassword: 'password2',
      });
      expect(res.status).toBe(401);
    });

    it('rejects a short new password', async () => {
      const { agent } = await registerAgent();
      const res = await agent.patch('/api/auth/password').send({
        currentPassword: 'password1',
        newPassword: 'short',
      });
      expect(res.status).toBe(400);
    });
  });
});
