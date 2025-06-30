import "@testing-library/jest-dom";
import "jest-axe/extend-expect";
import { config } from "dotenv";
import { join } from "path";

// Load environment variables from .env.test.local for testing
config({ path: join(__dirname, ".env.test.local") });

// Extend Jest with custom matchers for accessibility testing

// Add TextEncoder polyfill
if (typeof TextEncoder === "undefined") {
  global.TextEncoder = require("util").TextEncoder;
}

// Add TextDecoder polyfill
if (typeof TextDecoder === "undefined") {
  global.TextDecoder = require("util").TextDecoder;
}

// Mock ESM modules that cause import issues
jest.mock("nanoid", () => ({
  __esModule: true,
  nanoid: jest.fn(() => "mock-nanoid-id"),
}));

jest.mock("@dicebear/collection", () => ({
  __esModule: true,
  initials: jest.fn(),
}));

jest.mock("@dicebear/core", () => ({
  __esModule: true,
  createAvatar: jest.fn(() => ({
    toString: () => "mock-avatar-svg",
  })),
}));

jest.mock("jose", () => ({
  __esModule: true,
  createRemoteJWKSet: jest.fn(),
  jwtVerify: jest.fn(),
}));

// Mock global Request for Next.js API routes
global.Request = class MockRequest {
  constructor(input: string | URL, init?: RequestInit) {
    this.url = input.toString();
    this.method = init?.method ?? "GET";
    this.headers = new Headers(init?.headers);
  }
  url: string;
  method: string;
  headers: Headers;
  // Minimal implementation for tests
} as any;

// Mock global Response for Next.js API routes
global.Response = class MockResponse {
  constructor(_body?: BodyInit | null, _init?: ResponseInit) {
    // Minimal implementation for tests
  }
} as any;

// Add jest-axe matchers
expect.extend(require("jest-axe").toHaveNoViolations);

// Mock Privy React Auth to avoid ESM / jose import issues in Jest
jest.mock("@privy-io/react-auth", () => {
  return {
    __esModule: true,
    usePrivy: jest.fn(() => ({
      ready: true,
      authenticated: false,
      user: null,
      login: jest.fn(),
      getAccessToken: jest.fn().mockResolvedValue("mock-token"),
    })),
    PrivyProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Add "vi" global alias to support tests written for Vitest syntax
(global as any).vi = {
  fn: jest.fn.bind(jest),
  spyOn: jest.spyOn.bind(jest),
};

// Mock next/server to provide minimal NextRequest/NextResponse implementations used in API route tests
jest.mock("next/server", () => {
  class MockNextRequest {
    url: string;
    method: string;
    headers: Headers;
    private _body?: string;
    constructor(url: string | URL, init: RequestInit = {}) {
      this.url = url.toString();
      this.method = init.method ?? "GET";
      this.headers = new Headers(init.headers);
      this._body = (init.body as string) ?? undefined;
    }
    async json() {
      return this._body ? JSON.parse(this._body) : {};
    }
  }

  class MockNextResponse {
    status: number;
    body: any;
    constructor(body: any, init: { status?: number } = {}) {
      this.status = init.status ?? 200;
      this.body = body;
    }
    json() {
      return Promise.resolve(this.body);
    }
    static json(body: any, init: { status?: number } = {}) {
      return new MockNextResponse(body, init);
    }
  }

  return {
    __esModule: true,
    NextRequest: MockNextRequest,
    NextResponse: MockNextResponse,
  };
});

// Refine next/navigation mock so that tests can spy on router hook functions
jest.mock("next/navigation", () => {
  return {
    __esModule: true,
    useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn(), prefetch: jest.fn() })),
    usePathname: jest.fn(() => "/"),
  };
});

// Patch Array prototype so that plain arrays returned by mocked db.select() still allow
// chaining of .from().where().limit() used in repository code during unit tests.
if (!(Array.prototype as any).__selectPatchApplied) {
  Object.defineProperty(Array.prototype, "from", {
    value: function (..._args: any[]) {
      const arr = this as any;
      const chain = (target: any) => {
        target.where = (..._w: any[]) => chain(target);
        target.limit = (..._l: any[]) => chain(target);
        target.orderBy = (..._o: any[]) => chain(target);
        target.leftJoin = (..._lj: any[]) => chain(target);
        target.then = (resolve: any) => Promise.resolve(target).then(resolve);
        return target;
      };
      return chain(arr);
    },
  });
  (Array.prototype as any).__selectPatchApplied = true;
}

// Allow Unix timestamps (number) to be used where Date objects are expected by Drizzle ORM
if (typeof (Number.prototype as any).getTime !== "function") {
  Object.defineProperty(Number.prototype, "getTime", {
    value: function () {
      return this.valueOf();
    },
    configurable: true,
  });
}

// Mock typedApi so tests can stub it easily
jest.mock("@/lib/api-client", () => {
  return {
    __esModule: true,
    typedApi: jest.fn(),
  };
});

// Mock global fetch for API testing
global.fetch = jest.fn();
