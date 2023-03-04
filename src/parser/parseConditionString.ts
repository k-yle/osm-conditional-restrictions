/**
 * At the moment, we don't try to parse the value at all. This is up
 * to the opening_hours library or downstream consumers.
 */
export function parseConditionString(rawString: string) {
  return rawString.trim();
}
