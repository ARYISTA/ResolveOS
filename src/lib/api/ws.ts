/**
 * ws.ts — WebSocket wrapper
 *
 * In Mock mode: delegates to mockEngine (no real WS connection).
 * In Live mode: opens a native WebSocket to /ws/cases/{id}.
 *
 * Includes automatic reconnection with exponential backoff and snapshot recovery.
 * Returns a cleanup function. Components subscribe via this module only.
 */

import { getMode } from "./client";
import {
  startMockCase,
  abortMockCase,
  startMockIngestion,
  abortMockIngestion,
} from "@/lib/mock/mockEngine";
import { getMockCaseRecord } from "./cases";
import { WsEvent, NodeName } from "@/lib/schemas";

let _wsUrl = "";

export function configureWs(wsUrl: string): void {
  _wsUrl = wsUrl;
}

export type WsConnectionStatus = "connected" | "reconnecting" | "disconnected";

export interface CaseSubscriptionOptions {
  triggersHitl?: boolean;
  failNode?: NodeName;
  hitlModifiedAmount?: number;
  onStatusChange?: (status: WsConnectionStatus) => void;
  onReconnect?: () => void;
}

type Unsubscribe = () => void;

// Active simulated drop triggers for testing
const mockDropTriggers = new Map<string, () => void>();

/**
 * Simulate a WebSocket disconnect/drop for testing reconnect behavior.
 */
export function simulateWsDrop(caseId: string): void {
  const trigger = mockDropTriggers.get(caseId);
  if (trigger) {
    trigger();
  }
}

/**
 * Subscribe to case events with automatic reconnection and backoff.
 *
 * @param caseId  The case to subscribe to.
 * @param triggersHitlOrOpts  Whether case triggers HITL or full options object.
 * @param onEvent  Called for each incoming WebSocket event.
 * @param maybeOpts  Optional subscription options if triggersHitl was boolean.
 * @returns  Cleanup function — call on unmount.
 */
export function subscribeToCaseEvents(
  caseId: string,
  triggersHitlOrOpts: boolean | CaseSubscriptionOptions,
  onEvent: (event: WsEvent) => void,
  maybeOpts?: CaseSubscriptionOptions
): Unsubscribe {
  const opts: CaseSubscriptionOptions =
    typeof triggersHitlOrOpts === "boolean"
      ? { triggersHitl: triggersHitlOrOpts, ...maybeOpts }
      : triggersHitlOrOpts;

  const mode = getMode();

  if (mode === "mock") {
    // If case record exists in mock store, take failNode and hitlModifiedAmount from it
    const record = getMockCaseRecord(caseId);
    const triggersHitl = opts.triggersHitl ?? record?.triggersHitl ?? false;
    const failNode = opts.failNode ?? record?.failNode;
    const hitlModifiedAmount =
      opts.hitlModifiedAmount ?? record?.hitlModifiedAmount;

    opts.onStatusChange?.("connected");

    // Register simulated drop handler
    mockDropTriggers.set(caseId, () => {
      opts.onStatusChange?.("reconnecting");
      setTimeout(() => {
        opts.onStatusChange?.("connected");
        opts.onReconnect?.();
      }, 1500);
    });

    startMockCase(
      { caseId, triggersHitl, failNode, hitlModifiedAmount },
      onEvent
    );

    return () => {
      mockDropTriggers.delete(caseId);
      abortMockCase(caseId);
      opts.onStatusChange?.("disconnected");
    };
  }

  // Live mode: native WebSocket with backoff reconnection
  let isClosedByUser = false;
  let ws: WebSocket | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;

  function connect() {
    if (isClosedByUser) return;

    try {
      ws = new WebSocket(`${_wsUrl}/ws/cases/${caseId}`);

      ws.addEventListener("open", () => {
        attempt = 0;
        opts.onStatusChange?.("connected");
        opts.onReconnect?.();
      });

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

      ws.addEventListener("close", () => {
        if (isClosedByUser) return;
        opts.onStatusChange?.("reconnecting");

        // Exponential backoff: min 1000ms, max 10000ms
        const delay = Math.min(1000 * Math.pow(1.5, attempt), 10000);
        attempt++;
        reconnectTimeout = setTimeout(connect, delay);
      });

      ws.addEventListener("error", () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
    } catch {
      opts.onStatusChange?.("reconnecting");
      const delay = Math.min(1000 * Math.pow(1.5, attempt), 10000);
      attempt++;
      reconnectTimeout = setTimeout(connect, delay);
    }
  }

  connect();

  return () => {
    isClosedByUser = true;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close();
    }
    opts.onStatusChange?.("disconnected");
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
