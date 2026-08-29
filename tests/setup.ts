import { vi } from "vitest";
import { webcrypto } from "node:crypto";

// Ensure a JWT secret is available to the real auth/oauth modules under test.
// The app now requires JWT_SECRET and fails hard when it is missing.
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "figureforge-test-secret-not-used-in-production";
}

// Polyfill crypto global for Node 18 (needed by jose and identifiers)
if (typeof globalThis.crypto === "undefined") {
  (globalThis as any).crypto = webcrypto;
}

// Mock Prisma client globally for all tests
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    delete: vi.fn(),
  },
  otpCode: {
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  product: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
    aggregate: vi.fn(),
  },
  category: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  cart: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  cartItem: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  order: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  orderItem: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  coupon: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  analyticsEvent: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  },
  contactMessage: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  setting: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  },
  siteTheme: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  blogPost: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  $transaction: vi.fn((fns: unknown[]) => {
    if (Array.isArray(fns)) {
      return Promise.all(fns);
    }
    return fns;
  }),
  $queryRaw: vi.fn().mockResolvedValue([]),
};

vi.mock("@/lib/db", () => ({
  default: mockPrisma,
}));

// Mock auth module
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

export { mockPrisma };
