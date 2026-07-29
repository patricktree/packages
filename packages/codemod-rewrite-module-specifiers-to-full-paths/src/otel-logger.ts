import type { Attributes } from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";

const otelLogger = logs.getLogger("@patricktree/codemod-rewrite-module-specifiers-to-full-paths");

export const logger = {
  debug(message: string, attributes?: Attributes): void {
    otelLogger.emit({
      body: message,
      severityNumber: SeverityNumber.DEBUG,
      severityText: "DEBUG",
      attributes,
    });
  },
};
