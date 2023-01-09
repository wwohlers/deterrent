import { string } from '../src/string';
import { ValidationError } from '../src/ValidationError';

test('constructor', () => {
  expect(string().assert('hi')).toBe('hi');
  expect(string().assert('')).toBe('');
  expect(() => string().assert(5)).toThrowError(new ValidationError('Value must be a string'));
  expect(() => string().assert(null)).toThrowError(new ValidationError('Value must be a string'));
  expect(() => string().assert(undefined)).toThrowError(new ValidationError('Value must be a string'));
  expect(() => string().assert({})).toThrowError(new ValidationError('Value must be a string'));
  expect(() => string().assert([])).toThrowError(new ValidationError('Value must be a string'));
  expect(() => string().assert(() => {})).toThrowError(new ValidationError('Value must be a string'));
  expect(() => string().assert(Symbol())).toThrowError(new ValidationError('Value must be a string'));
});

test('minLength', () => {
  expect(string().minLength(5).assert('hello')).toBe('hello');
  expect(() => string().minLength(5).assert('hi')).toThrowError(
    new ValidationError('Value must be at least 5 characters'),
  );
});

test('maxLength', () => {
  expect(string().maxLength(5).assert('hi')).toBe('hi');
  expect(string().maxLength(4, { truncate: true }).assert('hello'));
  expect(() =>
    string().maxLength(4, { errorMessage: 'Value cannot be more than 4 characters' }).assert('hello'),
  ).toThrowError(new ValidationError('Value cannot be more than 4 characters'));
});

test('pattern', () => {
  expect(
    string()
      .pattern(/^[a-z]+$/)
      .assert('hello'),
  ).toBe('hello');
  expect(() =>
    string()
      .pattern(/^[a-z]+$/, { errorMessage: 'Value can only contain lowercase letters' })
      .assert('hello123'),
  ).toThrowError(new ValidationError('Value can only contain lowercase letters'));
});

test('custom', () => {
  expect(
    string()
      .custom((value, error) => {
        if (value.length < 5) {
          error('Value must be at least 5 characters');
        }
        return value;
      })
      .assert('hello'),
  ).toBe('hello');
  expect(() =>
    string()
      .custom((value, error) => {
        if (value.length < 5) {
          error('Value must be at least 5 characters');
        }
        return value;
      })
      .assert('hi'),
  ).toThrowError(new ValidationError('Value must be at least 5 characters'));
});

test('split', () => {
  expect(string().split(',').minLength(3).assert('a,b,c')).toEqual(['a', 'b', 'c']);
  expect(() => string().split(',', { listName: 'Character list' }).minLength(4).assert('a,b,c')).toThrow(
    new ValidationError('Character list must contain at least 4 items'),
  );
});
