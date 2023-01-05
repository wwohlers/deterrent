import { array, ArrayValidator } from './array';
import { Assertable } from './types';
import { ValidationError } from './ValidationError';

export type StringValidator = {
  minLength: (minLength: number) => StringValidator;
  maxLength: (maxLength: number, options?: { truncate?: boolean }) => StringValidator;
  pattern: (pattern: RegExp) => StringValidator;
  split: (separator: string, options?: { listName?: string }) => ArrayValidator<string>;
  custom: (validator: (value: string, error: (message: string) => void) => string) => StringValidator;
} & Assertable<string>;

export function string(
  options?: {
    name?: string;
    initialAssert?: (value: unknown) => string;
  },
) {
  const { name, initialAssert } = {
    name: 'Value',
    initialAssert: (value: unknown) => {
      if (typeof value !== 'string') {
        throw new ValidationError(name, 'must be a string');
      }
      return value;
    },
    ...options,
  };

  function chain(assert: (value: unknown) => string): StringValidator {
    const next = (nextFunction: (value: string) => string) => chain((value: unknown) => nextFunction(assert(value)));
    return {
      minLength: (minLength) =>
        next((value) => {
          if (value.length < minLength) {
            throw new ValidationError(name, `must be at least ${minLength} characters`);
          }
          return value;
        }),
      maxLength: (maxLength, options) =>
        next((value) => {
          if (value.length > maxLength) {
            if (options?.truncate) {
              return value.slice(0, maxLength);
            }
            throw new ValidationError(name, `must be at most ${maxLength} characters`);
          }
          return value;
        }),
      pattern: (pattern) =>
        next((value) => {
          if (!pattern.test(value)) {
            throw new ValidationError(name, `must match the pattern ${pattern}`);
          }
          return value;
        }),
      custom: (validator) =>
        next((value) => {
          return validator(value, (message: string) => {
            throw new ValidationError(name, message);
          });
        }),
      split: (separator, options?: { listName?: string }) => {
        const { listName } = { listName: `List of ${name}`, ...options };
        return array<string>({
          name: listName,
          initialAssert: (value) => {
            const str = assert(value);
            if (str === undefined || str === null) {
              return [];
            }
            return str.split(separator);
          },
        });
      },
      assert,
    };
  }

  return chain(initialAssert);
}
