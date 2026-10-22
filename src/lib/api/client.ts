/**
 * client.ts — thin HTTP wrapper
 *
 * In Mock mode: returns fixtures (imported from mock/fixtures.ts).
 * In Live mode: calls the Spring Boot REST API.
 *
 * Components never call fetch directly; they use the functions here.
 */

import type { Mode } from "@/lib/schemas";

let _mode: Mode = "mock";
let _baseUrl = "http://localhost:8080";
let _authToken: string | null = null;
const _onAuthExpiredListeners: Set<() => void> = new Set();

export class ApiError extends Error {
  public status: number;
  public details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(`API error ${status}: ${message}`);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function configureClient(mode: Mode, baseUrl: string): void {
  _mode = mode;
  if (baseUrl) {
    _baseUrl = baseUrl.replace(/\/+$/, "");
  }
}

export function getBaseUrl(): string {
  return _baseUrl;
}

export function getMode(): Mode {
  return _mode;
}

// ─── In-memory Authentication (Never stored in localStorage) ──────────────────

export function setAuthToken(token: string | null): void {
  _authToken = token;
}

export function getAuthToken(): string | null {
  return _authToken;
}

export function onAuthExpired(callback: () => void): () => void {
  _onAuthExpiredListeners.add(callback);
  return () => {
    _onAuthExpiredListeners.delete(callback);
  };
}

export async function login(username: string, password: string): Promise<string> {
  const requestId = crypto.randomUUID();
  try {
    const res = await fetch(`${_baseUrl}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
      },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new ApiError(res.status, errText || "Login authentication failed");
    }

    const data = await res.json();
    const token = data.token || data.accessToken || data.jwt || "demo-live-token";
    _authToken = token;
    return token;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // In mock fallback mode, return a dummy demo token if offline
    if (_mode === "mock") {
      const demoToken = `mock-token-${crypto.randomUUID().slice(0, 8)}`;
      _authToken = demoToken;
      return demoToken;
    }
    throw new ApiError(503, err instanceof Error ? err.message : "Authentication service unreachable");
  }
}

export function logout(): void {
  _authToken = null;
}

// ─── Connection Health Test ──────────────────────────────────────────────────

export async function testConnection(
  urlToCheck?: string
): Promise<{ ok: boolean; status: number; message: string }> {
  const targetBase = (urlToCheck || _baseUrl).replace(/\/+$/, "");
  const requestId = crypto.randomUUID();

  try {
    const res = await fetch(`${targetBase}/api/metrics/summary`, {
      method: "GET",
      headers: {
        "x-request-id": requestId,
        ...(_authToken ? { Authorization: `Bearer ${_authToken}` } : {}),
      },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      return { ok: true, status: res.status, message: "Connected successfully" };
    }

    return {
      ok: false,
      status: res.status,
      message: `Backend returned HTTP ${res.status}: ${res.statusText}`,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      message: err instanceof Error ? err.message : "Connection failed (network unreachable)",
    };
  }
}

// ─── Core fetch wrapper (live mode) ──────────────────────────────────────────

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, signal } = options;

  const requestId = crypto.randomUUID();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-request-id": requestId,
  };

  if (_authToken) {
    headers["Authorization"] = `Bearer ${_authToken}`;
  }

  // Safe dev-only log redacting token and customer data
  if (process.env.NODE_ENV === "development") {
    // Redact authorization for safety
    const safeHeaders = { ...headers };
    if (safeHeaders["Authorization"]) {
      safeHeaders["Authorization"] = "Bearer [REDACTED]";
    }
  }

  try {
    const res = await fetch(`${_baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });

    if (res.status === 401) {
      _authToken = null;
      _onAuthExpiredListeners.forEach((listener) => listener());
      throw new ApiError(401, "Session expired. Please re-authenticate.");
    }

    if (!res.ok) {
      const errText = await res.text();
      let cleanMessage = errText;
      try {
        const jsonErr = JSON.parse(errText);
        cleanMessage = jsonErr.message || jsonErr.error || errText;
      } catch {
        // Plain text error response
      }
      throw new ApiError(res.status, cleanMessage || res.statusText);
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(503, err instanceof Error ? err.message : "Network error");
  }
}
