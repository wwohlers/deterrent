import { array, ArrayValidator } from "./array";
import {
  Assertable,
  Optional,
  ValidationError,
} from "./types";

export type StringValidator = {
  minLength: (minLength: number) => StringValidator;
  maxLength: (maxLength: number) => StringValidator;
  pattern: (pattern: RegExp) => StringValidator;
  split: (
    separator: string,
    options?: { listName?: string }
  ) => ArrayValidator<string>;
  custom: (
    validator: (
      value: string,
      error: (message: string) => void
    ) => string
  ) => StringValidator;
} & Assertable<string>;

export function string(
  name: string = "Value",
  options?: Partial<{
    initialAssert?: (value: unknown) => string;
  }>
) {
  const { initialAssert } = {
    initialAssert: (value: unknown) => {
      if (typeof value !== "string") {
        throw new ValidationError(name, "must be a string");
      }
      return value;
    },
    ...options,
  };

  function chain(
    oldAssert: (value: unknown) => string,
    fun: (value: string) => string
  ): StringValidator {
    const assert = (value: unknown) => fun(oldAssert(value));
    return {
      minLength: (minLength) =>
        chain(assert, (value) => {
          if (value.length < minLength) {
            throw new ValidationError(
              name,
              `must be at least ${minLength} characters`
            );
          }
          return value;
        }),
      maxLength: (maxLength) =>
        chain(assert, (value) => {
          if (value.length > maxLength) {
            throw new ValidationError(
              name,
              `must be at most ${maxLength} characters`
            );
          }
          return value;
        }),
      pattern: (pattern) =>
        chain(assert, (value) => {
          if (!pattern.test(value)) {
            throw new ValidationError(name, `must match ${pattern}`);
          }
          return value;
        }),
      custom: (validator) =>
        chain(assert, (value) => {
          return validator(
            value,
            (message: string) => {
              throw new ValidationError(name, message);
            }
          );
        }),
      split: (separator, options?: { listName?: string }) => {
        const { listName } = { listName: `List of ${name}`, ...options };
        return array<string>(listName, {
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

  return chain(initialAssert, (value) => value);
}
