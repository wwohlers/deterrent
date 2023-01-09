import { array } from '../src/array';
import { string } from '../src/string';
import { ValidationError } from '../src/ValidationError';

test('constructor', () => {
  expect(array().assert([1, 2, 3])).toEqual([1, 2, 3]);
  expect(array().assert([])).toEqual([]);
  expect(array({ coerce: true }).assert(5)).toEqual([5]);
  expect(() => array().assert(5)).toThrowError(new ValidationError('Value must be an array'));
  expect(() => array().assert(null)).toThrowError(new ValidationError('Value must be an array'));
  expect(() => array().assert(undefined)).toThrowError(new ValidationError('Value must be an array'));
  expect(() => array().assert({})).toThrowError(new ValidationError('Value must be an array'));
  expect(() => array().assert('')).toThrowError(new ValidationError('Value must be an array'));
  expect(() => array().assert(() => {})).toThrowError(new ValidationError('Value must be an array'));
  expect(() => array().assert(Symbol())).toThrowError(new ValidationError('Value must be an array'));
});

test('minLength', () => {
  expect(array().minLength(5).assert([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
  expect(() => array().minLength(5, { errorMessage: 'Test error message' }).assert([1, 2, 3, 4])).toThrowError(
    new ValidationError('Test error message'),
  );
});

test('maxLength', () => {
  expect(array().maxLength(5).assert([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
  expect(array().maxLength(4, { truncate: true }).assert([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4]);
  expect(() => array().maxLength(5).assert([1, 2, 3, 4, 5, 6])).toThrowError(
    new ValidationError('Value must contain at most 5 items'),
  );
});

test('of', () => {
  expect(array().of(string()).assert(['hello', 'world'])).toEqual(['hello', 'world']);
  expect(array().of(string(), { allOrNothing: false }).assert([5])).toEqual([]);
  expect(() => array().of(string()).assert([5])).toThrowError(
    new ValidationError('Value item at index 0 is invalid: Value must be a string'),
  );
  expect(() => array().of(string()).assert([5])).toThrowError(
    new ValidationError('Value item at index 0 is invalid: Value must be a string'),
  );
});

test('multiple calls', () => {
  expect(array().of(string()).minLength(2).assert(['hello', 'world'])).toEqual(['hello', 'world']);
  expect(() => array().of(string()).minLength(2, { errorMessage: 'Test 2 items' }).assert(['hello'])).toThrowError(
    new ValidationError('Test 2 items'),
  );
});
