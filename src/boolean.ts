import { Assertable, Optional, TypeFromRequired, ValidationError } from "./types";

export type BooleanValidator<REQUIRED extends boolean> = {
  required: (_default?: boolean) => BooleanValidator<true>;
  true: () => BooleanValidator<REQUIRED>;
  false: () => BooleanValidator<REQUIRED>;
} & Assertable<TypeFromRequired<boolean, REQUIRED>>;

export function boolean<INIT_REQUIRED extends boolean>(
  name: string = "Value",
  options?: Partial<{
    coerce?: boolean;
    initialAssert: (value: unknown) => TypeFromRequired<boolean, INIT_REQUIRED>;
  }>
) {
  const { coerce, initialAssert } = {
    coerce: false,
    initialAssert: (value: unknown) => {
      if (typeof value !== "boolean") {
        if (value === null || value === undefined) {
          return value;
        }
        if (coerce) {
          return Boolean(value);
        }
        throw new ValidationError(name, "must be a boolean");
      }
      return value;
    },
    ...options,
  };

  function chain<REQUIRED extends boolean>(
    oldAssert: (value: unknown) => Optional<boolean>,
    fun: (value: Optional<boolean>) => TypeFromRequired<boolean, REQUIRED>
  ): BooleanValidator<REQUIRED> {
    const assert = (value: unknown) => fun(oldAssert(value));
    return {
      required: (_default?: boolean) =>
        chain<true>(assert, (value) => {
          if (value === undefined || value === null) {
            if (_default) return _default;
            throw new ValidationError(name, "is required");
          }
          return value;
        }),
      true: () =>
        chain<REQUIRED>(assert, (value) => {
          if (value === undefined || value === null) {
            return value as TypeFromRequired<boolean, REQUIRED>;
          }
          if (!value) {
            throw new ValidationError(name, "must be true");
          }
          return value;
        }),
      false: () =>
        chain<REQUIRED>(assert, (value) => {
          if (value === undefined || value === null) {
            return value as TypeFromRequired<boolean, REQUIRED>;
          }
          if (value) {
            throw new ValidationError(name, "must be false");
          }
          return value;
        }),
      assert,
    };
  }

  return chain<INIT_REQUIRED>(initialAssert, (value) => value as TypeFromRequired<boolean, INIT_REQUIRED>);
}
