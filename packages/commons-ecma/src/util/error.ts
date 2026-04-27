import { errWithCause } from 'pino-std-serializers';

export function serializeErrorWithCause(error: Error) {
  return errWithCause(error);
}

/**
 * @deprecated Use `serializeErrorWithCause` instead.
 */
export const serializeErrorWithClause = serializeErrorWithCause;
