import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('auth middleware', () => {
  const app = createApp();

  it('GET /api/health returns 200 without Authorization', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GET /api/other returns 401 without Authorization', async () => {
    const res = await request(app).get('/api/other');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error', 'Unauthorized');
  });
});
