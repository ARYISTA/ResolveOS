/**
 * ws.ts — WebSocket wrapper
 *
 * In Mock mode: delegates to mockEngine (no real WS connection).
 * In Live mode: opens a native WebSocket to /ws/cases/{id}.
 *
 * Returns a cleanup function. Components subscribe via this module only.
 */

import { getMode } from "./client";
import {
  startMockCase,
  abortMockCase,
  startMockIngestion,
  abortMockIngestion,
} from "@/lib/mock/mockEngine";
import { WsEvent } from "@/lib/schemas";

let _wsUrl = "";

export function configureWs(wsUrl: string): void {
  _wsUrl = wsUrl;
}

type Unsubscribe = () => void;

/**
 * Subscribe to case events.
 *
 * @param caseId  The case to subscribe to.
 * @param triggersHitl  Mock-mode only: whether this case should pause at HITL.
 * @param onEvent  Called for each event.
 * @returns  Cleanup function — call on unmount.
 */
export function subscribeToCaseEvents(
  caseId: string,
  triggersHitl: boolean,
  onEvent: (event: WsEvent) => void
): Unsubscribe {
  const mode = getMode();

  if (mode === "mock") {
    startMockCase({ caseId, triggersHitl }, onEvent);
    return () => abortMockCase(caseId);
  }

  // Live mode: native WebSocket
  const ws = new WebSocket(`${_wsUrl}/ws/cases/${caseId}`);

  ws.addEventListener("message", (msg) => {
    try {
      const raw: unknown = JSON.parse(msg.data as string);
      const parsed = WsEvent.safeParse(raw);
      if (parsed.success) {
        onEvent(parsed.data);
      }
    } catch {
      // Malformed frame — ignore
    }
  });

  return () => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  };
}

/**
 * Subscribe to policy ingestion events.
 *
 * @param policyId  The policy id to track.
 * @param onEvent   Called for each INGESTION_PROGRESS event.
 * @returns         Cleanup function — call on unmount.
 */
export function subscribeToIngestion(
  policyId: string,
  onEvent: (event: WsEvent) => void
): Unsubscribe {
  const mode = getMode();

  if (mode === "mock") {
    startMockIngestion(policyId, onEvent);
    return () => abortMockIngestion(policyId);
  }

  // Live mode: native WebSocket
  const ws = new WebSocket(`${_wsUrl}/ws/policies/${policyId}`);

  ws.addEventListener("message", (msg) => {
    try {
      const raw: unknown = JSON.parse(msg.data as string);
      const parsed = WsEvent.safeParse(raw);
      if (parsed.success) {
        onEvent(parsed.data);
      }
    } catch {
      // Malformed frame — ignore
    }
  });

  return () => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  };
}

