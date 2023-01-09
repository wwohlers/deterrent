import { string } from '../src/string';
import { tuple } from '../src/tuple';
import { number } from '../src/number';
import { ValidationError } from '../src/ValidationError';

test('constructor', () => {
  expect(tuple().assert([1, 2, 3])).toEqual([1, 2, 3]);
  expect(tuple().assert([])).toEqual([]);
  expect(() => tuple().assert(5)).toThrowError(new ValidationError('Value must be an array'));
  expect(() => tuple().assert(null)).toThrowError(new ValidationError('Value must be an array'));
  expect(() => tuple().assert(undefined)).toThrowError(new ValidationError('Value must be an array'));
  expect(() => tuple().assert({})).toThrowError(new ValidationError('Value must be an array'));
  expect(() => tuple().assert(() => {})).toThrowError(new ValidationError('Value must be an array'));
  expect(() => tuple().assert(Symbol())).toThrowError(new ValidationError('Value must be an array'));
});

test('of', () => {
  expect(tuple().of([string(), number()]).assert(['hi', 5])).toEqual(['hi', 5]);
  expect(tuple().of([string(), number()], { throwIfExtra: false }).assert(['hi', 5, 'bye'])).toEqual(['hi', 5]);
  expect(() => tuple().of([string(), number()]).assert(['hi', false])).toThrowError(
    new ValidationError('Value item at tuple index 1 is invalid: Value must be a number'),
  );
  expect(() =>
    tuple()
      .of([string(), number()], { errorMessage: 'Wrong number of items', throwIfExtra: true })
      .assert(['hi', 5, 'bye']),
  ).toThrowError(new ValidationError('Wrong number of items'));
  expect(() => tuple().of([string(), number()]).assert(['hi'])).toThrowError(
    new ValidationError('Value must contain exactly 2 items'),
  );
});
