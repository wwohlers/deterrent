import { boolean } from '../src/boolean';
import { ValidationError } from '../src/ValidationError';

test('constructor', () => {
  expect(boolean().assert(true)).toBe(true);
  expect(boolean().assert(false)).toBe(false);
  expect(() => boolean().assert(5)).toThrowError(new ValidationError('Value must be a boolean'));
  expect(() => boolean({ name: 'Test name' }).assert(null)).toThrowError(
    new ValidationError('Test name must be a boolean'),
  );
  expect(() => boolean().assert(undefined)).toThrowError(new ValidationError('Value must be a boolean'));
  expect(() => boolean().assert({})).toThrowError(new ValidationError('Value must be a boolean'));
  expect(() => boolean().assert([])).toThrowError(new ValidationError('Value must be a boolean'));
  expect(() => boolean().assert(() => {})).toThrowError(new ValidationError('Value must be a boolean'));
  expect(() => boolean().assert(Symbol())).toThrowError(new ValidationError('Value must be a boolean'));
});

test('true', () => {
  expect(boolean().true().assert(true)).toBe(true);
  expect(() => boolean().true().assert(false)).toThrowError(new ValidationError('Value must be true'));
});

test('false', () => {
  expect(boolean().false().assert(false)).toBe(false);
  expect(() => boolean().false({ errorMessage: 'Value cannot be true' }).assert(true)).toThrowError(
    new ValidationError('Value cannot be true'),
  );
});
