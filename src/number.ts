import { string, StringValidator } from './string';
import { Assertable } from './types';
import { ValidationError } from './ValidationError';

type NumberValidator = {
  min: (minValue: number, options?: { errorMessage?: string }) => NumberValidator;
  max: (maxValue: number, options?: { errorMessage?: string }) => NumberValidator;
  integer: (
    options?: Partial<{
      errorMessage?: string;
      roundIfNot: boolean;
      divisibleBy: number;
    }>,
  ) => NumberValidator;
  custom: (validator: (value: number, error: (message: string) => void) => number) => NumberValidator;
  asString: () => StringValidator;
} & Assertable<number>;

export function number(initOptions?: {
  name?: string;
  allowNumericString?: boolean;
  initialAssert?: (value: unknown) => number;
}) {
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
            throw new ValidationError(`${name} must be numeric`);
          }
        }
        throw new ValidationError(`${name} must be a number`);
      }
      return value;
    },
    ...initOptions,
  };

  function chain(assert: (value: unknown) => number): NumberValidator {
    const next = (nextFunction: (value: number) => number) => chain((value) => nextFunction(assert(value)));
    return {
      min: (minValue, options) =>
        next((value) => {
          if (value < minValue) {
            throw new ValidationError(options?.errorMessage ?? `${name} cannot be less than ${minValue}`);
          }
          return value;
        }),
      max: (maxValue, options) =>
        next((value) => {
          if (value > maxValue) {
            throw new ValidationError(options?.errorMessage ?? `${name} cannot be greater than ${maxValue}`);
          }
          return value;
        }),
      integer: (options) => {
        const { roundIfNot, divisibleBy, errorMessage } = {
          roundIfNot: true,
          divisibleBy: 1,
          ...options,
        };
        return next((value) => {
          if (!Number.isInteger(value) && !roundIfNot) {
            throw new ValidationError(errorMessage ?? `${name} must be an integer`);
          }
          const rounded = Math.round(value);
          if (rounded % divisibleBy !== 0) {
            throw new ValidationError(errorMessage ?? `${name} must be divisible by ${divisibleBy}`);
          }
          return rounded;
        });
      },
      custom: (validator) =>
        next((value) => {
          return validator(value, (message: string) => {
            throw new ValidationError(message);
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
