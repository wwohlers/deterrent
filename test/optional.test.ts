import { optional } from '../src/optional';
import { string } from '../src/string';
import { ValidationError } from '../src/ValidationError';

test('optional', () => {
  expect(optional(string()).assert('hi')).toEqual('hi');
  expect(optional(string()).assert(undefined)).toEqual(undefined);
  expect(() => optional(string(), { allowNull: false }).assert(null)).toThrowError(
    new ValidationError('Value', 'must not be null'),
  );
});

test('default', () => {
  expect(optional(string(), { defaultValue: 'hi' }).assert(undefined)).toEqual('hi');
  expect(optional(string(), { defaultValue: 'test' }).assert('hi')).toEqual('hi');
});
