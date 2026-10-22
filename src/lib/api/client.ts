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
let _baseUrl = "";

export function configureClient(mode: Mode, baseUrl: string): void {
  _mode = mode;
  _baseUrl = baseUrl;
}

export function getMode(): Mode {
  return _mode;
}

// ─── Core fetch wrapper (live mode only) ──────────────────────────────────────

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
  const res = await fetch(`${_baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-request-id": requestId,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<T>;
}
