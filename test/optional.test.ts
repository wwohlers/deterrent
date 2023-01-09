import { optional } from '../src/optional';
import { string } from '../src/string';
import { ValidationError } from '../src/ValidationError';

test('optional', () => {
  expect(optional(string()).assert('hi')).toEqual('hi');
  expect(optional(string()).assert(undefined)).toEqual(undefined);
  expect(optional(string(), { allowNull: true }).assert(null)).toEqual(null);
  expect(() => optional(string(), { errorMessage: 'error' }).assert(null)).toThrowError(new ValidationError('error'));
});

test('default', () => {
  expect(optional(string(), { errorMessage: 'error', defaultValue: 'hi' }).assert(undefined)).toEqual('hi');
  expect(optional(string(), { defaultValue: 'test' }).assert('hi')).toEqual('hi');
});
