import { string, StringValidator } from './string';
import { Assertable } from './types';
import { ValidationError } from './ValidationError';

type NumberValidator = {
  min: (minValue: number) => NumberValidator;
  max: (maxValue: number) => NumberValidator;
  integer: (
    options?: Partial<{
      roundIfNot: boolean;
      divisibleBy: number;
    }>,
  ) => NumberValidator;
  custom: (validator: (value: number, error: (message: string) => void) => number) => NumberValidator;
  asString: () => StringValidator;
} & Assertable<number>;

export function number(
  options?: {
    name?: string;
    allowNumericString?: boolean;
    initialAssert?: (value: unknown) => number;
  },
) {
  const { name, allowNumericString, initialAssert } = {
    name: 'Value',
    allowNumericString: true,
    initialAssert: (value: unknown) => {
      if (typeof value !== 'number') {
        if (typeof value === 'string' && allowNumericString) {
          const parsed = Number(value);
          if (!Number.isNaN(parsed)) {
            return parsed;
          } else {
            throw new ValidationError(name, 'must be numeric');
          }
        }
        throw new ValidationError(name, 'must be a number');
      }
      return value;
    },
    ...options,
  };

  function chain(assert: (value: unknown) => number): NumberValidator {
    const next = (nextFunction: (value: number) => number) => chain((value) => nextFunction(assert(value)));
    return {
      min: (minValue: number) =>
        next((value) => {
          if (value < minValue) {
            throw new ValidationError(name, `must be greater than ${minValue}`);
          }
          return value;
        }),
      max: (maxValue: number) =>
        next((value) => {
          if (value > maxValue) {
            throw new ValidationError(name, `must be less than ${maxValue}`);
          }
          return value;
        }),
      integer: (
        options?: Partial<{
          roundIfNot: boolean;
          divisibleBy: number;
        }>,
      ) => {
        const { roundIfNot, divisibleBy } = {
          roundIfNot: true,
          divisibleBy: 1,
          ...options,
        };
        return next((value) => {
          if (!Number.isInteger(value) && !roundIfNot) {
            throw new ValidationError(name, 'must be an integer');
          }
          const rounded = Math.round(value);
          if (rounded % divisibleBy !== 0) {
            throw new ValidationError(name, `must be divisible by ${divisibleBy}`);
          }
          return rounded;
        });
      },
      custom: (validator) =>
        next((value) => {
          return validator(value, (message: string) => {
            throw new ValidationError(name, message);
          });
        }),
      asString: () =>
        string({
          name,
          initialAssert: (value: unknown) => {
            const num = assert(value);
            return num.toString();
          },
        }),
      assert,
    };
  }

  return chain(initialAssert);
}
