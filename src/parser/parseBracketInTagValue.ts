import type { LogicalOperatorNode, Node } from '../types.js';
import { parseConditionString } from './parseConditionString.js';

/** matches ` AND ` or `)AND ` or ` AND(` or `)AND(` */
const innerAndRegex = /(^|[ )])and([ (])$/i;

/**
 * This function parses everything after the @ until the end
 * of that statement (i.e. until the EOL, a semi colon, or 'AND')
 */
export function parseBracketInTagValue(
  subStr: string,
  depth = 0,
  intitialBracesOpenCount = 0,
): [endI: number, tree: Node] {
  let bracesOpenCount = intitialBracesOpenCount;
  const currentConditions: Node[] = [];
  let currentCondition = '';
  let currentOperator: LogicalOperatorNode['operator'] | false = false;

  if (depth > 20) throw new SyntaxError('Too many opening brackets');

  function done(): Node {
    if (bracesOpenCount !== 0) {
      throw new SyntaxError('Expected a closing bracket');
    }

    // remove blank conditions added by parsing a single character
    const truthyConditions = currentConditions.filter((c) =>
      c.type === 'Condition' ? c.string : true,
    );

    if (!truthyConditions.length) {
      throw new SyntaxError('Empty group');
    }
    if (truthyConditions.length === 1) {
      return truthyConditions[0]!;
    }
    return {
      type: 'LogicalOperator',
      operator: currentOperator || 'AND',
      children: truthyConditions,
    };
  }

  for (let index = 0; index < subStr.length; index++) {
    const char = subStr[index];

    const implicitEndDoubleCondition = bracesOpenCount === 0 && char === ';';
    if (char === ')' || implicitEndDoubleCondition) {
      if (char === ')') bracesOpenCount--;

      currentConditions.push({
        type: 'Condition',
        string: parseConditionString(currentCondition),
      });
      currentCondition = '';

      if (bracesOpenCount < 0) {
        throw new SyntaxError('Unexpected closing bracket');
      } else if (bracesOpenCount === 0) {
        // end of this condition
        return [index - +implicitEndDoubleCondition, done()];
      } else {
        // end of the condition, but there is more to come
        // The next thing should be an InnerOrToken or InnerAndToken
      }
      currentOperator = false;
    } else if (char === '(') {
      bracesOpenCount++;

      const [relativeK, group] = parseBracketInTagValue(
        subStr.slice(index + 1),
        depth + 1,
        1,
      );
      currentConditions.push(group);
      index += relativeK;
    } else if (char === ';') {
      if (currentOperator === 'AND') {
        throw new SyntaxError('mix of AND/OR without braces');
      }
      currentOperator = 'OR';

      currentConditions.push({
        type: 'Condition',
        string: parseConditionString(currentCondition),
      });
      currentCondition = '';
    } else if (innerAndRegex.test(subStr.slice(0, index + 2))) {
      if (currentOperator === 'OR') {
        throw new SyntaxError('mix of AND/OR without braces');
      }

      // we will have already started adding the word "AND" so remove it
      const nextTwoChars = subStr.slice(index, index + 2);
      currentCondition = (currentCondition + nextTwoChars).replace(
        innerAndRegex,
        '',
      );

      currentOperator = 'AND';

      currentConditions.push({
        type: 'Condition',
        string: parseConditionString(currentCondition),
      });
      currentCondition = '';
    } else {
      // text from within the condition
      currentCondition += char;
    }
  }

  if (currentCondition) {
    currentConditions.push({
      type: 'Condition',
      string: parseConditionString(currentCondition),
    });
    currentCondition = '';
  }

  return [subStr.length, done()];
}
