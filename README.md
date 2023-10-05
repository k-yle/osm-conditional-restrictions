# OpenStreetMap conditional restriction parser

[![Build Status](https://github.com/k-yle/osm-conditional-restrictions/workflows/Build%20and%20Test/badge.svg)](https://github.com/k-yle/osm-conditional-restrictions/actions)
[![Coverage Status](https://coveralls.io/repos/github/k-yle/osm-conditional-restrictions/badge.svg?branch=main&t=LQmPNl)](https://coveralls.io/github/k-yle/osm-conditional-restrictions?branch=main)
[![npm version](https://badge.fury.io/js/osm-conditional-restrictions.svg)](https://badge.fury.io/js/osm-conditional-restrictions)
[![npm](https://img.shields.io/npm/dt/osm-conditional-restrictions.svg)](https://www.npmjs.com/package/osm-conditional-restrictions)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/osm-conditional-restrictions)

📅🔒 Javascript/Typescript parser for OpenStreetMap [conditional restrictions](https://osm.wiki/Conditional_restrictions).

## Install

```sh
npm install osm-conditional-restrictions
```

## Usage

```js
import { parseConditionalRestrictions } from 'osm-conditional-restrictions';

const tags = {
  access: 'no',
  'access:conditional': 'yes @ (09:00-17:00 ; weight < 3.5)',
};
const output = parseConditionalRestrictions('access', tags);

// `output` will be an object that looks like this:
({
  default: 'no',
  exceptions: [
    {
      value: 'yes',
      if: {
        type: 'LogicalOperator',
        operator: 'OR',
        children: [
          { type: 'Condition', string: '09:00-17:00' },
          { type: 'Condition', string: 'weight < 3.5' },
        ],
      },
    },
  ],
});
```

## Scope

This library doesn't try to parse the conditional values, such as `09:00-17:00`.
To parse the [opening hours syntax](https://osm.wiki/Key:opening_hours), check out the [opening_hours](https://npm.im/opening_hours) library.

## Related Work

- [simonpoole/ConditionalRestrictionParser](https://github.com/simonpoole/ConditionalRestrictionParser) - An equivalent library written in Java
