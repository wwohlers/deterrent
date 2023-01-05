import { number } from '../src/number';
import { ValidationError } from '../src/ValidationError';

test('constructor', () => {
  expect(number().assert(5)).toBe(5);
  expect(number().assert(-3.6)).toBe(-3.6);
  expect(number({ allowNumericString: true }).assert('8')).toBe(8);
  expect(() => number({ name: 'test value', allowNumericString: false }).assert('8')).toThrowError(
    new ValidationError('test value', 'must be a number'),
  );
  expect(() => number({ allowNumericString: true }).assert('hi')).toThrowError(
    new ValidationError('Value', 'must be numeric'),
  );
  expect(() => number().assert(null)).toThrowError(new ValidationError('Value', 'must be a number'));
  expect(() => number().assert(undefined)).toThrowError(new ValidationError('Value', 'must be a number'));
  expect(() => number().assert({})).toThrowError(new ValidationError('Value', 'must be a number'));
  expect(() => number().assert([])).toThrowError(new ValidationError('Value', 'must be a number'));
  expect(() => number().assert(() => {})).toThrowError(new ValidationError('Value', 'must be a number'));
  expect(() => number().assert(Symbol())).toThrowError(new ValidationError('Value', 'must be a number'));
});

test('min', () => {
  expect(number().min(5).assert(5)).toBe(5);
  expect(number().min(5).assert(6)).toBe(6);
  expect(() => number().min(5).assert(4)).toThrowError(new ValidationError('Value', 'must be greater than 5'));
});

test('max', () => {
  expect(number().max(5).assert(5)).toBe(5);
  expect(number().max(5).assert(4)).toBe(4);
  expect(() => number().max(5).assert(6)).toThrowError(new ValidationError('Value', 'must be less than 5'));
});

test('integer', () => {
  expect(number().integer().assert(5)).toBe(5);
  expect(number().integer().assert(4)).toBe(4);
  expect(() => number().integer({ roundIfNot: false }).assert(4.5)).toThrowError(
    new ValidationError('Value', 'must be an integer'),
  );
  expect(number().integer().assert(4.5)).toBe(5);
  expect(number().integer().assert(4.4)).toBe(4);
  expect(number().integer({ divisibleBy: 2 }).assert(4)).toBe(4);
  expect(() => number().integer({ divisibleBy: 2 }).assert(5)).toThrowError(
    new ValidationError('Value', 'must be divisible by 2'),
  );
});

test('multiple calls', () => {
  expect(number().min(5).max(10).assert(5)).toBe(5);
  expect(number().min(5).max(10).assert(10)).toBe(10);
  expect(number().min(5).max(10).assert(7)).toBe(7);
  expect(number().min(5).integer({ roundIfNot: true, divisibleBy: 2 }).assert(6)).toBe(6);
  expect(number().min(5).integer({ roundIfNot: true, divisibleBy: 2 }).assert(5.6)).toBe(6);
  expect(() => number().min(5).max(10).assert(4)).toThrowError(new ValidationError('Value', 'must be greater than 5'));
  expect(() => number().min(5).max(10).assert(11)).toThrowError(new ValidationError('Value', 'must be less than 10'));
  expect(() => number().min(5).integer({ roundIfNot: true, divisibleBy: 2 }).assert(5.2)).toThrowError(
    new ValidationError('Value', 'must be divisible by 2'),
  );
});

test('custom', () => {
  expect(
    number()
      .custom((value, error) => {
        if (value < 5) {
          error('must be greater than 5');
        }
        return value;
      })
      .assert(6),
  ).toBe(6);
  expect(() =>
    number()
      .custom((value, error) => {
        if (value < 5) {
          error('must be greater than 5');
        }
        return value;
      })
      .assert(4),
  ).toThrowError(new ValidationError('Value', 'must be greater than 5'));
});

test('as string', () => {
  expect(number().asString().assert(5)).toBe('5');
  expect(number().asString().assert(100.3)).toBe('100.3');
  expect(number().asString().maxLength(3, { truncate: true }).assert(100.3)).toBe('100');
});
