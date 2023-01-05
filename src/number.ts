import { string, StringValidator } from "./string";
import { Assertable, ValidationError } from "./types";

type NumberValidator = {
  min: (minValue: number) => NumberValidator;
  max: (maxValue: number) => NumberValidator;
  integer: (
    options?: Partial<{
      roundIfNot: boolean;
      divisibleBy: number;
    }>
  ) => NumberValidator;
  custom: (
    validator: (value: number, error: (message: string) => void) => number
  ) => NumberValidator;
  asString: () => StringValidator;
} & Assertable<number>;

export function number(
  name: string = "Value",
  options?: Partial<{
    allowNumericString?: boolean;
    initialAssert?: (value: unknown) => number;
  }>
) {
  const { allowNumericString, initialAssert } = {
    allowNumericString: true,
    initialAssert: (value: unknown) => {
      if (typeof value !== "number") {
        if (typeof value === "string" && allowNumericString) {
          const parsed = Number(value);
          if (!Number.isNaN(parsed)) {
            return parsed;
          } else {
            throw new ValidationError(name, "must be numeric");
          }
        }
        throw new ValidationError(name, "must be a number");
      }
      return value;
    },
    ...options,
  };

  function chain(
    oldAssert: (value: unknown) => number,
    fun: (value: number) => number
  ): NumberValidator {
    const assert = (value: unknown) => fun(oldAssert(value));
    return {
      min: (minValue: number) =>
        chain(assert, (value) => {
          if (value < minValue) {
            throw new ValidationError(name, `must be greater than ${minValue}`);
          }
          return value;
        }),
      max: (maxValue: number) =>
        chain(assert, (value) => {
          if (value > maxValue) {
            throw new ValidationError(name, `must be less than ${maxValue}`);
          }
          return value;
        }),
      integer: (
        options?: Partial<{
          roundIfNot: boolean;
          divisibleBy: number;
        }>
      ) => {
        const { roundIfNot, divisibleBy } = {
          roundIfNot: true,
          divisibleBy: 1,
          ...options,
        };
        return chain(assert, (value) => {
          if (!Number.isInteger(value) && !roundIfNot) {
            throw new ValidationError(name, "must be an integer");
          }
          const rounded = Math.round(value);
          if (rounded % divisibleBy !== 0) {
            throw new ValidationError(
              name,
              `must be divisible by ${divisibleBy}`
            );
          }
          return rounded;
        });
      },
      custom: (
        validator
      ) =>
        chain(assert, (value) => {
          return validator(value, (message: string) => {
            throw new ValidationError(name, message);
          });
        }),
      asString: () =>
        string(name, {
          initialAssert: (value: unknown) => {
            const num = assert(value);
            return num.toString();
          },
        }),
      assert,
    };
  }

  return chain(initialAssert, (value) => value);
}
