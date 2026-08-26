import { useEffect, useRef, useState } from "react";
import { executeWebMcpTool } from "@/lib/webMcpResult";

export interface WebMcpToolDefinition {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input?: Record<string, unknown>) => unknown | Promise<unknown>;
}

interface ModelContextLike {
  registerTool?: (
    tool: WebMcpToolDefinition,
    options?: { signal?: AbortSignal; exposedTo?: string[] }
  ) => void | Promise<void>;
}

interface UseWebMcpToolOptions extends WebMcpToolDefinition {
  enabled?: boolean;
}

export interface WebMcpRegistrationState {
  supported: boolean;
  registered: boolean;
  error: Error | null;
}

function getModelContext(): ModelContextLike | null {
  if (typeof document === "undefined") return null;
  const documentContext = (document as unknown as { modelContext?: ModelContextLike }).modelContext;
  const navigatorContext = typeof navigator === "undefined"
    ? undefined
    : (navigator as unknown as { modelContext?: ModelContextLike }).modelContext;
  return documentContext ?? navigatorContext ?? null;
}

export function useWebMcpTool({
  name,
  title,
  description,
  inputSchema,
  execute,
  enabled = true
}: UseWebMcpToolOptions): WebMcpRegistrationState {
  const executeRef = useRef(execute);
  const [state, setState] = useState<WebMcpRegistrationState>({
    supported: Boolean(getModelContext()?.registerTool),
    registered: false,
    error: null
  });
  const schemaKey = JSON.stringify(inputSchema);

  useEffect(() => {
    executeRef.current = execute;
  }, [execute]);

  useEffect(() => {
    if (!enabled) {
      setState((current) => ({ ...current, registered: false, error: null }));
      return;
    }

    let disposed = false;
    let attempts = 0;
    let retryTimer: number | null = null;
    let controller: AbortController | null = null;

    async function register() {
      const modelContext = getModelContext();
      if (!modelContext?.registerTool) {
        if (attempts < 8 && !disposed) {
          attempts += 1;
          retryTimer = window.setTimeout(register, 250);
        } else if (!disposed) {
          setState({ supported: false, registered: false, error: null });
        }
        return;
      }

      controller = new AbortController();
      try {
        await modelContext.registerTool({
          name,
          title,
          description,
          inputSchema,
          execute: (input) => executeWebMcpTool(executeRef.current, input)
        }, { signal: controller.signal });
        if (!disposed) setState({ supported: true, registered: true, error: null });
      } catch (caught) {
        if (!disposed) {
          setState({
            supported: true,
            registered: false,
            error: caught instanceof Error ? caught : new Error(String(caught))
          });
        }
      }
    }

    void register();
    return () => {
      disposed = true;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      controller?.abort();
    };
  }, [description, enabled, name, schemaKey, title]);

  return state;
}
