import { parseTagValue } from './parser/parseTagValue.js';
import type { Conditional, Tags } from './types.js';

/**
 * @param baseKey is a key like "access" or "maxstay".
 * Given a base key of `X`, this function will look at
 * both `X` and `X:conditional`.
 */
export function parseConditionalRestrictions(
  baseKey: string,
  tags: Tags,
): Conditional {
  return {
    default: tags[baseKey],
    exceptions: parseTagValue(tags[`${baseKey}:conditional`]),
  };
}
