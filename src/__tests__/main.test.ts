import { describe, it, expect } from 'vitest';
import { parseConditionalRestrictions, type Exception } from '../index.js';

describe('parseConditionalRestrictions', () => {
  const noAtWet = {
    value: 'no',
    if: { type: 'Condition', string: 'wet' },
  } as const;
  const yesAtLowTide = {
    value: 'yes',
    if: { type: 'Condition', string: 'low_tide' },
  } as const;

  const validTestCases: Record<string, Exception[]> = {
    '': [],

    // basic
    'no @ (wet)': [noAtWet],
    'no @ (wet);': [noAtWet],

    'no @ wet': [noAtWet],
    'no @ wet;': [noAtWet],
    ' no   @   wet ': [noAtWet],
    ' no   @  ( wet )': [noAtWet],
    // multiple possible outcomes
    'no @ wet;yes @ low_tide': [noAtWet, yesAtLowTide],
    'no @ wet;yes @ low_tide;': [noAtWet, yesAtLowTide],
    'no @ wet;yes @ (low_tide)': [noAtWet, yesAtLowTide],
    'no @ (wet);yes @ low_tide': [noAtWet, yesAtLowTide],
    'no @ (wet);yes @ (low_tide)': [noAtWet, yesAtLowTide],
    'no @ (((wet)));yes @ ((low_tide))': [noAtWet, yesAtLowTide],
    'no@wet;no@(wet)': [noAtWet, noAtWet],

    // multiple conditions within one outcome
    'no @ (wet;low_tide)': [
      {
        value: 'no',
        if: {
          type: 'LogicalOperator',
          operator: 'OR',
          children: [
            { type: 'Condition', string: 'wet' },
            { type: 'Condition', string: 'low_tide' },
          ],
        },
      },
    ],

    'no @ (wet AND low_tide)': [
      {
        value: 'no',
        if: {
          type: 'LogicalOperator',
          operator: 'AND',
          children: [
            { type: 'Condition', string: 'wet' },
            { type: 'Condition', string: 'low_tide' },
          ],
        },
      },
    ],

    'no @ ((wet;dry) AND (high_tide;low_tide))': [
      {
        value: 'no',
        if: {
          type: 'LogicalOperator',
          operator: 'AND',
          children: [
            {
              type: 'LogicalOperator',
              operator: 'OR',
              children: [
                { type: 'Condition', string: 'wet' },
                { type: 'Condition', string: 'dry' },
              ],
            },
            {
              type: 'LogicalOperator',
              operator: 'OR',
              children: [
                { type: 'Condition', string: 'high_tide' },
                { type: 'Condition', string: 'low_tide' },
              ],
            },
          ],
        },
      },
    ],

    '  no  @  ( (wet ;  dry )  AND( high_tide ; low_tide) ) ': [
      {
        value: 'no',
        if: {
          type: 'LogicalOperator',
          operator: 'AND',
          children: [
            {
              type: 'LogicalOperator',
              operator: 'OR',
              children: [
                { type: 'Condition', string: 'wet' },
                { type: 'Condition', string: 'dry' },
              ],
            },
            {
              type: 'LogicalOperator',
              operator: 'OR',
              children: [
                { type: 'Condition', string: 'high_tide' },
                { type: 'Condition', string: 'low_tide' },
              ],
            },
          ],
        },
      },
    ],

    // more than 2 conditions
    'permit @ (wet;dry;low_tide)': [
      {
        value: 'permit',
        if: {
          type: 'LogicalOperator',
          operator: 'OR',
          children: [
            { type: 'Condition', string: 'wet' },
            { type: 'Condition', string: 'dry' },
            { type: 'Condition', string: 'low_tide' },
          ],
        },
      },
    ],
    'no @ (wet AND dry AND low_tide)': [
      {
        value: 'no',
        if: {
          type: 'LogicalOperator',
          operator: 'AND',
          children: [
            { type: 'Condition', string: 'wet' },
            { type: 'Condition', string: 'dry' },
            { type: 'Condition', string: 'low_tide' },
          ],
        },
      },
    ],
    'no @ ((wet)AND dry AND(low_tide)AND(high_tide))': [
      {
        value: 'no',
        if: {
          type: 'LogicalOperator',
          operator: 'AND',
          children: [
            { type: 'Condition', string: 'wet' },
            { type: 'Condition', string: 'dry' },
            { type: 'Condition', string: 'low_tide' },
            { type: 'Condition', string: 'high_tide' },
          ],
        },
      },
    ],

    // more than two values
    'yes @ (Mo-Fr 09:00-1700); destination @ (21:00-21:30)': [
      {
        value: 'yes',
        if: { type: 'Condition', string: 'Mo-Fr 09:00-1700' },
      },
      {
        value: 'destination',
        if: { type: 'Condition', string: '21:00-21:30' },
      },
    ],

    // commas
    'no @ (Mo-Fr 14:00-21:00; Sa-Su,PH 07:00-10:00)': [
      {
        value: 'no',
        if: {
          type: 'LogicalOperator',
          operator: 'OR',
          children: [
            { type: 'Condition', string: 'Mo-Fr 14:00-21:00' },
            { type: 'Condition', string: 'Sa-Su,PH 07:00-10:00' },
          ],
        },
      },
    ],

    // nested (example from https://community.osm.org/t/101512)
    'yes @ (stay > 2 hours AND (Mo-Fr 07:00-19:00; Sa 07:00-13:00))': [
      {
        value: 'yes',
        if: {
          type: 'LogicalOperator',
          operator: 'AND',
          children: [
            { type: 'Condition', string: 'stay > 2 hours' },
            {
              type: 'LogicalOperator',
              operator: 'OR',
              children: [
                { type: 'Condition', string: 'Mo-Fr 07:00-19:00' },
                { type: 'Condition', string: 'Sa 07:00-13:00' },
              ],
            },
          ],
        },
      },
    ],
  };

  describe('valid', () => {
    it.each(Object.entries(validTestCases))('%s', (tagValue, exceptions) => {
      const tags = { 'access:conditional': tagValue };
      expect(parseConditionalRestrictions('access', tags)).toStrictEqual({
        default: undefined,
        exceptions,
      });
    });
  });

  describe('invalid', () => {
    it.each`
      tagValue                                   | error
      ${'no'}                                    | ${'No conditions'}
      ${'@'}                                     | ${'No conditions'}
      ${' @ '}                                   | ${'No conditions'}
      ${'yes @ ()'}                              | ${'Empty group'}
      ${' @ ()'}                                 | ${'Empty group'}
      ${'@()'}                                   | ${'Empty group'}
      ${'yes @ ('}                               | ${'Expected a closing bracket'}
      ${'yes @ (('}                              | ${'Expected a closing bracket'}
      ${'yes @ )'}                               | ${'Unexpected closing bracket'}
      ${'yes @ ())'}                             | ${'Empty group'}
      ${'yes @ (a AND b ; c)'}                   | ${'mix of AND/OR without braces'}
      ${'yes @ (a ; b AND c)'}                   | ${'mix of AND/OR without braces'}
      ${'yes @ 1;yes (i forgot the at symbol) '} | ${'Unexpected end of input'}
      ${'yes @ 1;abc'}                           | ${'Unexpected end of input'}
      ${'yes @ 1;;'}                             | ${'Unexpected end of input'}
    `('$tagValue', ({ tagValue, error }) => {
      const tags = { 'access:conditional': tagValue };
      expect(() => {
        console.error(
          'This tagValue should not be valid',
          tagValue,
          parseConditionalRestrictions('access', tags),
        );
      }).toThrow(new Error(error));
    });
  });
});
