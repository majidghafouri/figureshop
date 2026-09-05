import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../setup";

const { mockOk, mockFail, mockParseJson, mockGetSessionUserFromRequest, mockIsAnalyticsEventType, mockTrackEvent, mockGetRequestMeta, mockAddToCart, mockGetOrCreateCart, mockGetCartItems } = vi.hoisted(() => ({
  mockOk: vi.fn(),
  mockFail: vi.fn(),
  mockParseJson: vi.fn(),
  mockGetSessionUserFromRequest: vi.fn(),
  mockIsAnalyticsEventType: vi.fn(),
  mockTrackEvent: vi.fn(),
  mockGetRequestMeta: vi.fn(),
  mockAddToCart: vi.fn(),
  mockGetOrCreateCart: vi.fn(),
  mockGetCartItems: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  ok: (...args: any[]) => mockOk(...args),
  fail: (...args: any[]) => mockFail(...args),
  parseJson: (...args: any[]) => mockParseJson(...args),
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getSessionUserFromRequest: (...args: any[]) => mockGetSessionUserFromRequest(...args),
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: (...args: any[]) => mockTrackEvent(...args),
  getRequestMeta: (...args: any[]) => mockGetRequestMeta(...args),
  isAnalyticsEventType: (...args: any[]) => mockIsAnalyticsEventType(...args),
}));

vi.mock("@/lib/cart", () => ({
  addToCart: (...args: any[]) => mockAddToCart(...args),
  getOrCreateCart: (...args: any[]) => mockGetOrCreateCart(...args),
  getCartItems: (...args: any[]) => mockGetCartItems(...args),
}));

describe("Cart API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/cart", () => {
    it("returns missing_product for empty body", async () => {
      mockParseJson.mockReturnValue({});
      mockFail.mockReturnValue({
        json: async () => ({ ok: false, error: "missing_product" }),
        status: 400,
      });

      const { POST } = await import("@/app/api/cart/route");
      const req = new Request("http://localhost/api/cart", {
        method: "POST",
      }) as any;
      req.text = async () => JSON.stringify({});
      req.nextUrl = { pathname: "/fa/api/cart" };
      req.cookies = { get: vi.fn() };
      const res = await POST(req);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error).toBe("missing_product");
    });

    it("returns 404 for non-existent product", async () => {
      mockParseJson.mockReturnValue({ productId: "nonexistent", quantity: 1 });
      mockPrisma.product.findUnique.mockResolvedValue(null);
      mockFail.mockReturnValue({
        json: async () => ({ ok: false, error: "product_not_found" }),
        status: 404,
      });

      const { POST } = await import("@/app/api/cart/route");
      const req = new Request("http://localhost/api/cart", {
        method: "POST",
      }) as any;
      req.text = async () =>
        JSON.stringify({ productId: "nonexistent", quantity: 1 });
      req.nextUrl = { pathname: "/fa/api/cart" };
      req.cookies = { get: vi.fn() };
      const res = await POST(req);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error).toBe("product_not_found");
    });

    it("returns 404 for inactive product", async () => {
      mockParseJson.mockReturnValue({ productId: "prod1", quantity: 1 });
      mockPrisma.product.findUnique.mockResolvedValue({
        id: "prod1",
        isActive: false,
        stock: 10,
      });
      mockFail.mockReturnValue({
        json: async () => ({ ok: false, error: "product_not_found" }),
        status: 404,
      });

      const { POST } = await import("@/app/api/cart/route");
      const req = new Request("http://localhost/api/cart", {
        method: "POST",
      }) as any;
      req.text = async () =>
        JSON.stringify({ productId: "prod1", quantity: 1 });
      req.nextUrl = { pathname: "/fa/api/cart" };
      req.cookies = { get: vi.fn() };
      const res = await POST(req);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error).toBe("product_not_found");
    });

    it("returns 404 for deactivated product", async () => {
      mockParseJson.mockReturnValue({ productId: "prod1", quantity: 1 });
      mockPrisma.product.findUnique.mockResolvedValue({
        id: "prod1",
        isActive: true,
        isDeactivated: true,
        stock: 10,
      });
      mockFail.mockReturnValue({
        json: async () => ({ ok: false, error: "product_not_found" }),
        status: 404,
      });

      const { POST } = await import("@/app/api/cart/route");
      const req = new Request("http://localhost/api/cart", {
        method: "POST",
      }) as any;
      req.text = async () =>
        JSON.stringify({ productId: "prod1", quantity: 1 });
      req.nextUrl = { pathname: "/fa/api/cart" };
      req.cookies = { get: vi.fn() };
      const res = await POST(req);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error).toBe("product_not_found");
    });

    it("adds product to cart successfully", async () => {
      mockParseJson.mockReturnValue({ productId: "prod1", quantity: 2 });
      mockPrisma.product.findUnique.mockResolvedValue({
        id: "prod1",
        isActive: true,
        stock: 10,
      });
      mockAddToCart.mockResolvedValue({ error: null, items: [], newToken: "tok123" });
      mockOk.mockReturnValue({
        json: async () => ({ ok: true, data: { items: [] } }),
        status: 200,
        cookies: { set: vi.fn() },
      });

      const { POST } = await import("@/app/api/cart/route");
      const req = new Request("http://localhost/api/cart", {
        method: "POST",
      }) as any;
      req.text = async () =>
        JSON.stringify({ productId: "prod1", quantity: 2 });
      req.nextUrl = { pathname: "/fa/api/cart" };
      req.cookies = { get: vi.fn() };
      const res = await POST(req);
      const body = await res.json();
      expect(body.ok).toBe(true);
    });
  });

  describe("POST /api/contact", () => {
    it("returns error for empty body", async () => {
      mockParseJson.mockReturnValue({});
      mockFail.mockReturnValue({
        json: async () => ({ ok: false, error: "fill_required" }),
        status: 400,
      });

      const { POST } = await import("@/app/api/contact/route");
      const req = new Request("http://localhost/api/contact", {
        method: "POST",
      }) as any;
      req.text = async () => JSON.stringify({});
      const res = await POST(req);
      const body = await res.json();
      expect(body.ok).toBe(false);
    });

    it("creates contact message successfully", async () => {
      mockParseJson.mockReturnValue({
        name: "Test User",
        email: "test@example.com",
        message: "Hello",
      });
      mockPrisma.contactMessage.create.mockResolvedValue({
        id: "msg1",
        name: "Test User",
        email: "test@example.com",
        subject: "Test",
        message: "Hello",
      });
      mockOk.mockReturnValue({
        json: async () => ({ ok: true, data: { id: "msg1" } }),
        status: 200,
      });

      const { POST } = await import("@/app/api/contact/route");
      const req = new Request("http://localhost/api/contact", {
        method: "POST",
      }) as any;
      req.text = async () =>
        JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          message: "Hello",
        });
      const res = await POST(req);
      const body = await res.json();
      expect(body.ok).toBe(true);
    });
  });

  describe("POST /api/analytics/track", () => {
    it("returns error for invalid event type", async () => {
      mockParseJson.mockReturnValue({ type: "INVALID_TYPE" });
      mockIsAnalyticsEventType.mockReturnValue(false);
      mockFail.mockReturnValue({
        json: async () => ({ ok: false, error: "invalid_event" }),
        status: 400,
      });

      const { POST } = await import("@/app/api/analytics/track/route");
      const req = new Request("http://localhost/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }) as any;
      req.text = async () => JSON.stringify({ type: "INVALID_TYPE" });
      req.cookies = { get: vi.fn() };
      const res = await POST(req);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error).toBe("invalid_event");
    });

    it("tracks valid page view event", async () => {
      mockParseJson.mockReturnValue({ type: "PAGE_VIEW", path: "/products" });
      mockIsAnalyticsEventType.mockReturnValue(true);
      mockGetSessionUserFromRequest.mockResolvedValue(null);
      mockGetRequestMeta.mockReturnValue({ ip: null, userAgent: null, referrer: null });
      mockTrackEvent.mockResolvedValue(undefined);
      mockOk.mockReturnValue({
        json: async () => ({ ok: true, data: { tracked: true } }),
        status: 201,
      });

      const { POST } = await import("@/app/api/analytics/track/route");
      const req = new Request("http://localhost/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }) as any;
      req.text = async () =>
        JSON.stringify({ type: "PAGE_VIEW", path: "/products" });
      req.cookies = { get: vi.fn() };
      const res = await POST(req);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(mockTrackEvent).toHaveBeenCalled();
    });
  });
});
