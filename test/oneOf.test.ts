import { number } from '../src/number';
import { oneOf } from '../src/oneOf';
import { string } from '../src/string';
import { boolean } from '../src/boolean';
import { ValidationError } from '../src/ValidationError';
import { object } from '../src/object';

test('none', () => {
  expect(() => oneOf([]).assert(5)).toThrowError(new ValidationError('Value', 'must be one of the given types'));
});

test('one', () => {
  expect(oneOf([number()]).assert(5)).toEqual(5);
  expect(() => oneOf([number().max(5)]).assert(6)).toThrowError(
    new ValidationError('Value', 'must be one of the given types'),
  );
});

test('two', () => {
  expect(oneOf([number(), string()]).assert(5)).toEqual(5);
  expect(oneOf([number(), string()]).assert('hi')).toEqual('hi');
  expect(() => oneOf([number(), string()]).assert(true)).toThrowError(
    new ValidationError('Value', 'must be one of the given types'),
  );
});

test('three or more', () => {
  expect(oneOf([number(), string(), number()]).assert(5)).toEqual(5);
  expect(oneOf([number(), string(), boolean()]).assert('hi')).toEqual('hi');
  expect(oneOf([number(), string(), object()]).assert({})).toEqual({});
  expect(() => oneOf([boolean(), string(), object()]).assert(5)).toThrowError(
    new ValidationError('Value', 'must be one of the given types'),
  );
});
