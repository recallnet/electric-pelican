import { useCallback, useEffect, useRef } from "react";

import { DevLogEntry } from "@/types/logger";

// Shared Pino instance used by all hooks/components.
// Falls back to console if pino cannot be required (e.g., during Jest DOM tests).
const logger = {
  info: (...args: unknown[]) => console.info(...args),
  debug: (...args: unknown[]) => console.debug(...args),
  error: (...args: unknown[]) => console.error(...args),
};

function createLogEntry(entry: Omit<DevLogEntry, "timestamp">): DevLogEntry {
  return {
    timestamp: new Date().toISOString(),
    ...entry,
  } as DevLogEntry;
}

/**
 * Hook to log component renders and provide a helper for custom UI logs.
 *
 * @param componentName – Name of the React component (for log context)
 * @returns logUI helper – `(type, details, message?) => void`
 */
export function useDevLogger(componentName: string) {
  const renderCountRef = useRef(0);

  useEffect(() => {
    renderCountRef.current += 1;
    const entry = createLogEntry({
      level: "info",
      type: "component_render",
      component: componentName,
      details: { render: renderCountRef.current },
      message: `${componentName} rendered (${renderCountRef.current})`,
    });
    logger.info(entry);
  });

  /**
   * Log an arbitrary UI event related to this component.
   */
  const logUI = useCallback(
    (type: string, details: unknown = {}, message = `${componentName} ${type}`) => {
      const entry = createLogEntry({
        level: "info",
        type,
        component: componentName,
        details,
        message,
      });
      logger.info(entry);
    },
    [componentName],
  );

  return logUI;
}

// Named export for unit tests
export { createLogEntry as _createLogEntry, logger as _devLoggerInstance };
