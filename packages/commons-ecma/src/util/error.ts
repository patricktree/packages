import { errWithCause } from 'pino-std-serializers';

export function serializeErrorWithClause(error: Error) {
  return errWithCause(error);
}
