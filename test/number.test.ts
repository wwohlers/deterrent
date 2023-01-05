import { number } from '../src/number';
import { ValidationError } from '../src/types';

test('constructor works', () => {
  expect(number().assert(5)).toBe(5);
  expect(number().assert(-3.6)).toBe(-3.6);
  expect(number('num', { allowNumericString: true }).assert('8')).toBe(8);
  expect(() => number('num', { allowNumericString: false }).assert('8')).toThrowError(
    new ValidationError('num', 'must be a number'),
  );
  expect(() => number('num', { allowNumericString: true }).assert('hi')).toThrowError(
    new ValidationError('num', 'must be numeric'),
  );
});
