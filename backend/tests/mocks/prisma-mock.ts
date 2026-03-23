import { vi } from 'vitest';

export const prismaMock = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  refreshToken: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  lead: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
  },
  pipeline: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  stage: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  deal: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  cadence: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  cadenceStep: {
    create: vi.fn(),
  },
  cadenceExecution: {
    upsert: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  message: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  activity: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
};
