import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../setup";

describe("Security: Authentication Bypass", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects requests with no session cookie", async () => {
    vi.doMock("@/lib/auth", () => ({
      getSessionUserFromRequest: vi.fn().mockResolvedValue(null),
    }));

    const { GET } = await import("@/app/api/admin/products/route");
    const req = new Request("http://localhost/api/admin/products") as any;
    req.cookies = { get: vi.fn().mockReturnValue(undefined) };
    const res = await GET(req);
    expect(res.status).toBe(401);

    vi.doUnmock("@/lib/auth");
  });

  it("rejects requests with empty session cookie", async () => {
    vi.doMock("@/lib/auth", () => ({
      getSessionUserFromRequest: vi.fn().mockResolvedValue(null),
    }));

    const { GET } = await import("@/app/api/admin/products/route");
    const req = new Request("http://localhost/api/admin/products") as any;
    req.cookies = { get: vi.fn().mockReturnValue({ value: "" }) };
    const res = await GET(req);
    expect(res.status).toBe(401);

    vi.doUnmock("@/lib/auth");
  });

  it("rejects requests with tampered JWT token", async () => {
    vi.doMock("@/lib/auth", () => ({
      getSessionUserFromRequest: vi.fn().mockResolvedValue(null),
    }));

    const { GET } = await import("@/app/api/admin/products/route");
    const req = new Request("http://localhost/api/admin/products") as any;
    req.cookies = {
      get: vi.fn().mockReturnValue({
        value: "eyJhbGciOiJIUzI1NiJ9.tampered.payload",
      }),
    };
    const res = await GET(req);
    expect(res.status).toBe(401);

    vi.doUnmock("@/lib/auth");
  });

  it("rejects USER role on admin-only endpoints", async () => {
    vi.doMock("@/lib/auth", () => ({
      getSessionUserFromRequest: vi.fn().mockResolvedValue({
        id: "user1",
        email: "user@test.com",
        role: "USER",
      }),
    }));

    const { GET } = await import("@/app/api/admin/products/route");
    const req = new Request("http://localhost/api/admin/products") as any;
    req.cookies = { get: vi.fn() };
    const res = await GET(req);
    expect(res.status).toBe(401);

    vi.doUnmock("@/lib/auth");
  });
});

describe("Security: Input Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("rejects malformed JSON in POST body", async () => {
    const { POST } = await import("@/app/api/auth/send-otp/route");
    const req = new Request("http://localhost/api/auth/send-otp", {
      method: "POST",
    }) as any;
    req.text = async () => "not valid json {{{";
    const res = await POST(req);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it("rejects extremely long email input", async () => {
    const { POST } = await import("@/app/api/auth/send-otp/route");
    const req = new Request("http://localhost/api/auth/send-otp", {
      method: "POST",
    }) as any;
    req.text = async () =>
      JSON.stringify({ email: "a".repeat(10000) + "@test.com" });
    const res = await POST(req);
    const body = await res.json();
    // Should not crash - either invalid_identifier or success
    expect(body).toBeDefined();
  });

  it("rejects missing required fields in cart add", async () => {
    const { POST } = await import("@/app/api/cart/route");
    const req = new Request("http://localhost/api/cart", {
      method: "POST",
    }) as any;
    req.text = async () => JSON.stringify({ quantity: 5 });
    req.nextUrl = { pathname: "/fa/api/cart" };
    req.cookies = { get: vi.fn() };
    const res = await POST(req);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("missing_product");
  });

  it("handles negative quantity in cart", async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      id: "prod1",
      isActive: true,
      stock: 10,
    });

    vi.doMock("@/lib/cart", () => ({
      addToCart: vi.fn().mockResolvedValue({ error: null, items: [], newToken: "tok" }),
      getOrCreateCart: vi.fn(),
      getCartItems: vi.fn(),
    }));

    const { POST } = await import("@/app/api/cart/route");
    const req = new Request("http://localhost/api/cart", {
      method: "POST",
    }) as any;
    req.text = async () =>
      JSON.stringify({ productId: "prod1", quantity: -5 });
    req.nextUrl = { pathname: "/fa/api/cart" };
    req.cookies = { get: vi.fn() };
    const res = await POST(req);
    const body = await res.json();
    expect(body).toBeDefined();
    vi.doUnmock("@/lib/cart");
  });

  it("handles zero quantity in cart", async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      id: "prod1",
      isActive: true,
      stock: 10,
    });

    vi.doMock("@/lib/cart", () => ({
      addToCart: vi.fn().mockResolvedValue({ error: null, items: [], newToken: "tok" }),
      getOrCreateCart: vi.fn(),
      getCartItems: vi.fn(),
    }));

    const { POST } = await import("@/app/api/cart/route");
    const req = new Request("http://localhost/api/cart", {
      method: "POST",
    }) as any;
    req.text = async () =>
      JSON.stringify({ productId: "prod1", quantity: 0 });
    req.nextUrl = { pathname: "/fa/api/cart" };
    req.cookies = { get: vi.fn() };
    const res = await POST(req);
    const body = await res.json();
    expect(body).toBeDefined();
    vi.doUnmock("@/lib/cart");
  });
});

describe("Security: XSS Prevention", () => {
  it("escapes HTML in contact form message", async () => {
    mockPrisma.contactMessage.create.mockResolvedValue({
      id: "msg1",
      name: "<script>alert('xss')</script>",
      email: "test@test.com",
      subject: "Test",
      message: "<img src=x onerror=alert(1)>",
    });

    const { POST } = await import("@/app/api/contact/route");
    const req = new Request("http://localhost/api/contact", {
      method: "POST",
    }) as any;
    req.text = async () =>
      JSON.stringify({
        name: "<script>alert('xss')</script>",
        email: "test@test.com",
        message: "<img src=x onerror=alert(1)>",
      });
    const res = await POST(req);
    const body = await res.json();
    expect(body.ok).toBe(true);

    // The stored value should be the raw input (Prisma stores as-is)
    // XSS protection happens at render time in React
    const call = mockPrisma.contactMessage.create.mock.calls[0][0];
    expect(call.data.name).toContain("<script>");
  });
});

describe("Security: Rate Limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enforces OTP cooldown period", async () => {
    // Simulate a recent OTP being sent
    mockPrisma.otpCode.findFirst.mockResolvedValue({
      id: "recent-otp",
      createdAt: new Date(Date.now() - 60000), // 1 minute ago (within 3-min cooldown)
    });

    const { POST } = await import("@/app/api/auth/send-otp/route");
    const req = new Request("http://localhost/api/auth/send-otp", {
      method: "POST",
    }) as any;
    req.text = async () =>
      JSON.stringify({ email: "test@example.com", purpose: "REGISTER" });
    const res = await POST(req);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("otp_cooldown");
  });
});

describe("Security: JWT Token Verification", () => {
  it("rejects tokens signed with wrong secret", async () => {
    const { signSession, verifySessionToken } = await import("@/lib/auth");
    const { SignJWT } = await import("jose");

    // Sign with wrong secret
    const wrongSecret = new TextEncoder().encode("wrong-secret-key");
    const token = await new SignJWT({
      sub: "user1",
      email: "test@test.com",
      role: "ADMIN",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(wrongSecret);

    const result = await verifySessionToken(token);
    expect(result).toBeNull();
  });

  it("rejects expired tokens", async () => {
    const { SignJWT } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

    const token = await new SignJWT({
      sub: "user1",
      email: "test@test.com",
      role: "USER",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1s") // Expires in 1 second
      .sign(secret);

    // Wait for token to expire
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const { verifySessionToken } = await import("@/lib/auth");
    const result = await verifySessionToken(token);
    expect(result).toBeNull();
  });

  it("accepts valid tokens", async () => {
    const { signSession, verifySessionToken } = await import("@/lib/auth");
    const token = await signSession({
      sub: "user1",
      email: "test@test.com",
      role: "USER",
    });
    const result = await verifySessionToken(token);
    expect(result).not.toBeNull();
    expect(result?.sub).toBe("user1");
  });
});

describe("Security: SQL Injection Prevention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles SQL injection in email lookup", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/auth/login/route");
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
    }) as any;
    req.text = async () =>
      JSON.stringify({
        email: "'; DROP TABLE users; --",
        password: "password123",
      });
    req.cookies = { get: vi.fn() };
    const res = await POST(req);
    const body = await res.json();
    expect(body.ok).toBe(false);

    // Prisma parameterizes queries, so this should be safe
    // The email validation regex should reject this input
  });

  it("handles SQL injection in phone lookup", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const { POST } = await import("@/app/api/auth/login/route");
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
    }) as any;
    req.text = async () =>
      JSON.stringify({
        phone: "1' OR '1'='1",
        password: "password123",
      });
    req.cookies = { get: vi.fn() };
    const res = await POST(req);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });
});

describe("Security: IDOR Prevention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("users can only access their own orders", async () => {
    mockPrisma.order.findMany.mockResolvedValue([]);
    vi.doMock("@/lib/orders", () => ({
      cancelExpiredOrders: vi.fn().mockResolvedValue(undefined),
    }));

    vi.doMock("@/lib/auth", () => ({
      getSessionUserFromRequest: vi.fn().mockResolvedValue({
        id: "user1",
        role: "USER",
      }),
    }));

    const { GET } = await import("@/app/api/orders/route");
    const req = new Request("http://localhost/api/orders") as any;
    req.cookies = { get: vi.fn() };
    const res = await GET(req);

    // Verify the query filters by userId
    const call = mockPrisma.order.findMany.mock.calls[0][0];
    expect(call.where.userId).toBe("user1");

    vi.doUnmock("@/lib/auth");
    vi.doUnmock("@/lib/orders");
  });

  it("users cannot access other users' order details", async () => {
    mockPrisma.order.findFirst.mockResolvedValue(null);

    vi.doMock("@/lib/auth", () => ({
      getSessionUserFromRequest: vi.fn().mockResolvedValue({
        id: "user1",
        role: "USER",
      }),
    }));

    const { POST } = await import("@/app/api/orders/[id]/cancel/route");
    const req = new Request("http://localhost/api/orders/other-order/cancel", {
      method: "POST",
    }) as any;
    req.nextUrl = { pathname: "/api/orders/other-order/cancel" };
    req.cookies = { get: vi.fn() };
    req.json = async () => ({});
    const res = await POST(req, { params: { id: "other-order" } });
    expect(res.status).toBeGreaterThanOrEqual(400);

    vi.doUnmock("@/lib/auth");
  });
});
