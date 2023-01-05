import { ValidationError } from '../src/ValidationError';
import { object } from '../src/object';
import { string } from '../src/string';
import { number } from '../src/number';
import { optional } from '../src/optional';

test('constructor', () => {
  expect(object().assert({ a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
  expect(object().assert({})).toEqual({});
  expect(() => object().assert(5)).toThrowError(new ValidationError('Value', 'must be an object'));
  expect(() => object().assert(null)).toThrowError(new ValidationError('Value', 'must be an object'));
  expect(() => object().assert(undefined)).toThrowError(new ValidationError('Value', 'must be an object'));
  expect(() => object().assert([])).toThrowError(new ValidationError('Value', 'must be an object'));
  expect(() => object().assert(() => {})).toThrowError(new ValidationError('Value', 'must be an object'));
  expect(() => object().assert(Symbol())).toThrowError(new ValidationError('Value', 'must be an object'));
});

test('schema', () => {
  expect(
    object()
      .schema({
        name: string(),
        age: number(),
      })
      .assert({ name: 'John', age: 30 }),
  ).toEqual({ name: 'John', age: 30 });
  expect(
    object()
      .schema({
        name: string(),
        age: number(),
        friend: object().schema({
          name: string(),
          age: number(),
        }),
      })
      .assert({ name: 'John', age: 30, friend: { name: 'Jane', age: 25 } }),
  ).toEqual({
    name: 'John',
    age: 30,
    friend: {
      name: 'Jane',
      age: 25,
    },
  });
  expect(
    object()
      .schema({
        name: string(),
        age: optional(number()),
      })
      .assert({ name: 'John' }),
  ).toEqual({
    name: 'John',
    age: undefined,
  });
  expect(() =>
    object()
      .schema({
        name: string(),
        age: number(),
      })
      .assert({ name: 'John' }),
  ).toThrow(new ValidationError('Value', "at key 'age' is invalid: Value must be a number"));
});
