import { string, StringValidator } from "./string";
import { Assertable, Optional, TypeFromRequired, ValidationError } from "./types";

type NumberValidator<REQUIRED extends boolean> = {
  required: (_default?: number) => NumberValidator<true>;
  min: (minValue: number) => NumberValidator<REQUIRED>;
  max: (maxValue: number) => NumberValidator<REQUIRED>;
  integer: (
    options?: Partial<{
      roundIfNot: boolean;
      divisibleBy: number;
    }>
  ) => NumberValidator<REQUIRED>;
  custom: (
    validator: (value: TypeFromRequired<number, REQUIRED>, error: (message: string) => void) => number
  ) => NumberValidator<REQUIRED>;
  asString: () => StringValidator<REQUIRED>;
} & Assertable<TypeFromRequired<number, REQUIRED>>;

export function number<INIT_REQUIRED extends boolean>(
  name: string = "Value",
  options?: Partial<{
    allowNumericString?: boolean;
    initialAssert?: (value: unknown) => TypeFromRequired<number, INIT_REQUIRED>;
  }>
) {
  const { allowNumericString, initialAssert } = {
    allowNumericString: true,
    initialAssert: (value: unknown) => {
      if (typeof value !== "number") {
        if (value === null || value === undefined) {
          return value;
        }
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

  function chain<REQUIRED extends boolean>(
    oldAssert: (value: unknown) => Optional<number>,
    fun: (value: Optional<number>) => TypeFromRequired<number, REQUIRED>
  ): NumberValidator<REQUIRED> {
    const assert = (value: unknown) => fun(oldAssert(value));
    return {
      required: (_default?: number) =>
        chain<true>(assert, (value) => {
          if (value === undefined || value === null) {
            if (_default) return _default;
            throw new ValidationError(name, "is required");
          }
          return value;
        }),
      min: (minValue: number) =>
        chain(assert, (value) => {
          if (value === undefined || value === null) {
            return value as TypeFromRequired<number, REQUIRED>;
          }
          if (value < minValue) {
            throw new ValidationError(name, `must be greater than ${minValue}`);
          }
          return value;
        }),
      max: (maxValue: number) =>
        chain(assert, (value) => {
          if (value === undefined || value === null) {
            return value as TypeFromRequired<number, REQUIRED>;
          }
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
          if (value === undefined || value === null) {
            return value as TypeFromRequired<number, REQUIRED>;
          }
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
          return validator(value as TypeFromRequired<number, REQUIRED>, (message: string) => {
            throw new ValidationError(name, message);
          });
        }),
      asString: () =>
        string<REQUIRED>(name, {
          initialAssert: (value: unknown) => {
            const num = assert(value);
            if (num === undefined || num === null) {
              return num as TypeFromRequired<string, false> as TypeFromRequired<string, REQUIRED>;
            }
            return num.toString();
          },
        }),
      assert,
    };
  }

  return chain<INIT_REQUIRED>(initialAssert, (value) => value as TypeFromRequired<number, INIT_REQUIRED>);
}
