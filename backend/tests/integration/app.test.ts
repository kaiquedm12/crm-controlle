import request from 'supertest';
import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prismaMock } from '../mocks/prisma-mock';
import { signRefreshToken } from '../../src/shared/utils/jwt';

vi.mock('../../src/infra/database/prisma/client', () => ({
  prisma: prismaMock,
}));

import { app } from '../../src/main/app';

function resetPrismaMock() {
  for (const model of Object.values(prismaMock) as Array<Record<string, any>>) {
    for (const method of Object.values(model)) {
      if (typeof method?.mockReset === 'function') {
        method.mockReset();
      }
    }
  }
}

describe('Backend API', () => {
  beforeEach(() => {
    resetPrismaMock();
  });

  it('GET /health should return API status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toEqual(expect.any(String));
  });

  it('POST /auth/register should create a user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@crm.local',
      role: 'SELLER',
    });

    const response = await request(app).post('/auth/register').send({
      name: 'Test User',
      email: 'test@crm.local',
      password: 'secret123',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: 'user-1',
      name: 'Test User',
      email: 'test@crm.local',
      role: 'SELLER',
    });
    expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
  });

  it('POST /auth/login should return tokens with valid credentials', async () => {
    const passwordHash = await bcrypt.hash('secret123', 10);

    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@crm.local',
      passwordHash,
      role: 'SELLER',
    });
    prismaMock.refreshToken.create.mockResolvedValue(undefined);

    const response = await request(app).post('/auth/login').send({
      email: 'test@crm.local',
      password: 'secret123',
    });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      id: 'user-1',
      email: 'test@crm.local',
    });
    expect(prismaMock.refreshToken.create).toHaveBeenCalledTimes(1);
  });

  it('POST /auth/refresh should return a new access token', async () => {
    const refreshToken = signRefreshToken({ sub: 'user-1', role: 'SELLER' });

    prismaMock.refreshToken.findUnique.mockResolvedValue({
      token: refreshToken,
      userId: 'user-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@crm.local',
      role: 'SELLER',
    });

    const response = await request(app).post('/auth/refresh').send({ refreshToken });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toEqual(expect.any(String));
  });

  it('GET /users should require authentication', async () => {
    const response = await request(app).get('/users');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Token nao informado');
  });
});
