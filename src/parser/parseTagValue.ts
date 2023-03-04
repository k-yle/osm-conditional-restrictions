import type { Exception } from '../types.js';
import { parseBracketInTagValue } from './parseBracketInTagValue.js';

enum Syntax {
  ValueGroup,
  ConditionGroup,
  ConditionGroupComplete,
  AtToken,
}

/** parses the syntax of the tag value */
export function parseTagValue(tagValue: string | undefined): Exception[] {
  if (!tagValue) return [];

  const out: Exception[] = [];

  let context = Syntax.ValueGroup;

  let currentValue = '';

  for (let index = 0; index < tagValue.length; index++) {
    const char = tagValue[index]!;
    switch (context) {
      case Syntax.ValueGroup: {
        if (char === '@') {
          context = Syntax.AtToken;
        } else {
          currentValue += char;
        }
        break;
      }

      case Syntax.AtToken: {
        if (char !== ' ') {
          context = Syntax.ConditionGroup;
          index--; // re process this token in the new context
        }
        break;
      }

      case Syntax.ConditionGroup: {
        const [relativeJ, group] = parseBracketInTagValue(
          tagValue.slice(index),
        );
        out.push({ value: currentValue.trim(), if: group });
        currentValue = '';
        index += relativeJ;
        context = Syntax.ConditionGroupComplete;
        break;
      }

      case Syntax.ConditionGroupComplete: {
        // from here we can either have an EOF or another ValueGroup
        if (char === ';') {
          context = Syntax.ValueGroup;
        }
        break;
      }

      default: {
        /* @__PURE__ */ context satisfies never;
      }
    }
  }

  for (const parsedTagValue of out) {
    if (
      parsedTagValue.if?.type === 'LogicalOperator' &&
      parsedTagValue.if.children.length === 1
    ) {
      // remove AND or OR group with only one value
      parsedTagValue.if = parsedTagValue.if.children[0];
    }
  }

  if (!out.length) throw new SyntaxError('No conditions');
  if (out.some((x) => !x.value)) throw new SyntaxError('No conditional value');
  if (currentValue.trim()) throw new SyntaxError('Unexpected end of input');

  return out;
}
