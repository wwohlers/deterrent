import { array, ArrayValidator } from "./array";
import {
  Assertable,
  Optional,
  TypeFromRequired,
  ValidationError,
} from "./types";

export type StringValidator<REQUIRED extends boolean> = {
  required: (_default?: string) => StringValidator<true>;
  minLength: (minLength: number) => StringValidator<REQUIRED>;
  maxLength: (maxLength: number) => StringValidator<REQUIRED>;
  pattern: (pattern: RegExp) => StringValidator<REQUIRED>;
  split: (
    separator: string,
    options?: { listName?: string }
  ) => ArrayValidator<string, REQUIRED>;
  custom: (
    validator: (
      value: TypeFromRequired<string, REQUIRED>,
      error: (message: string) => void
    ) => TypeFromRequired<string, REQUIRED>
  ) => StringValidator<REQUIRED>;
} & Assertable<TypeFromRequired<string, REQUIRED>>;

export function string<INIT_REQUIRED extends boolean>(
  name: string = "Value",
  options?: Partial<{
    initialAssert?: (value: unknown) => TypeFromRequired<string, INIT_REQUIRED>;
  }>
) {
  const { initialAssert } = {
    initialAssert: (value: unknown) => {
      if (typeof value !== "string") {
        if (value === null || value === undefined) {
          return value;
        }
        throw new ValidationError(name, "must be a string");
      }
      return value;
    },
    ...options,
  };

  function chain<REQUIRED extends boolean>(
    oldAssert: (value: unknown) => Optional<string>,
    fun: (value: Optional<string>) => TypeFromRequired<string, REQUIRED>
  ): StringValidator<REQUIRED> {
    const assert = (value: unknown) => fun(oldAssert(value));
    return {
      required: (_default?: string) =>
        chain<true>(assert, (value) => {
          if (value === undefined || value === null) {
            if (_default) return _default;
            throw new ValidationError(name, "is required");
          }
          return value;
        }),
      minLength: (minLength) =>
        chain<REQUIRED>(assert, (value) => {
          if (value === undefined || value === null) {
            return value as TypeFromRequired<string, REQUIRED>;
          }
          if (value.length < minLength) {
            throw new ValidationError(
              name,
              `must be at least ${minLength} characters`
            );
          }
          return value;
        }),
      maxLength: (maxLength) =>
        chain<REQUIRED>(assert, (value) => {
          if (value === undefined || value === null) {
            return value as TypeFromRequired<string, REQUIRED>;
          }
          if (value.length > maxLength) {
            throw new ValidationError(
              name,
              `must be at most ${maxLength} characters`
            );
          }
          return value;
        }),
      pattern: (pattern) =>
        chain<REQUIRED>(assert, (value) => {
          if (value === undefined || value === null) {
            return value as TypeFromRequired<string, REQUIRED>;
          }
          if (!pattern.test(value)) {
            throw new ValidationError(name, `must match ${pattern}`);
          }
          return value;
        }),
      custom: (validator) =>
        chain<REQUIRED>(assert, (value) => {
          return validator(
            value as TypeFromRequired<string, REQUIRED>,
            (message: string) => {
              throw new ValidationError(name, message);
            }
          );
        }),
      split: (separator, options?: { listName?: string }) => {
        const { listName } = { listName: `List of ${name}`, ...options };
        return array<string, REQUIRED>(listName, {
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

  return chain<INIT_REQUIRED>(initialAssert, (value) => value as TypeFromRequired<string, INIT_REQUIRED>);
}
