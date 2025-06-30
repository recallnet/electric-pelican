declare module "next-logger" {
  import { Logger, LoggerOptions } from "pino";
  interface NextLoggerOptions {
    logger?: Logger;
    options?: LoggerOptions;
  }
  /**
   * Initialize next-logger with pino or default logger.
   */
  export default function nextLogger(options?: NextLoggerOptions): void;
}
