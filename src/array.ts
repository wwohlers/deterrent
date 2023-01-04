import { Assertable, Optional, TypeFromRequired, ValidationError } from "./types";

export type ArrayValidator<EL, REQUIRED extends boolean> = {
  required: (_default?: EL[]) => ArrayValidator<EL, true>;
  minLength: (minLength: number) => ArrayValidator<EL, REQUIRED>;
  maxLength: (maxLength: number) => ArrayValidator<EL, REQUIRED>;
  of: <NEW extends EL>(
    validator: (value: unknown) => NEW,
    options?: { allOrNothing?: boolean }
  ) => ArrayValidator<NEW, REQUIRED>;
} & Assertable<TypeFromRequired<EL[], REQUIRED>>;

export function array<INIT, INIT_REQUIRED extends boolean>(
  name: string = "Value",
  options?: Partial<{
    coerce?: boolean;
    initialAssert?: (value: unknown) => TypeFromRequired<INIT[], INIT_REQUIRED>;
  }>
) {
  const { coerce, initialAssert } = {
    coerce: false,
    initialAssert: (value: unknown) => {
      if (!Array.isArray(value)) {
        if (coerce) {
          if (value === null || value === undefined) {
            return [];
          }
          return [value];
        }
        throw new ValidationError(name, "must be an array");
      }
      return value;
    },
    ...options,
  };

  function chain<NEW extends INIT, REQUIRED extends boolean>(
    oldAssert: (value: unknown) => Optional<INIT[]>,
    fun: (value: Optional<INIT[]>) => TypeFromRequired<NEW[], REQUIRED>
  ): ArrayValidator<NEW, REQUIRED> {
    const assert = (value: unknown) => fun(oldAssert(value));
    return {
      required: (_default?: NEW[]) =>
        chain<NEW, true>(assert, (value) => {
          if (value === undefined || value === null) {
            if (_default) return _default;
            throw new ValidationError(name, "is required");
          }
          return value as NEW[];
        }),
      minLength: (minLength) =>
        chain<NEW, REQUIRED>(assert, (value) => {
          if (value === undefined || value === null) {
            return value as TypeFromRequired<NEW[], REQUIRED>;
          }
          if (value.length < minLength) {
            throw new ValidationError(
              name,
              `must contain at least ${minLength} items`
            );
          }
          return value as NEW[];
        }),
      maxLength: (maxLength) =>
        chain(assert, (value) => {
          if (value === undefined || value === null) {
            return value as TypeFromRequired<NEW[], REQUIRED>;
          }
          if (value.length > maxLength) {
            throw new ValidationError(
              name,
              `must contain at most ${maxLength} items`
            );
          }
          return value as NEW[];
        }),
      of: <EL extends INIT>(
        validator: (value: unknown) => EL,
        options?: { allOrNothing?: boolean }
      ) => {
        const { allOrNothing } = {
          allOrNothing: false,
          ...options,
        };
        return chain<EL, REQUIRED>(assert, (value) => {
          if (value === undefined || value === null) {
            return value as TypeFromRequired<EL[], REQUIRED>;
          }
          const res = [];
          for (let i = 0; i < value.length; i++) {
            try {
              res.push(validator(value[i]));
            } catch (e) {
              if (allOrNothing) {
                throw new ValidationError(
                  name,
                  `item at index ${i} is invalid: ${
                    (e as ValidationError).message
                  }`
                );
              }
            }
          }
          return res as EL[];
        });
      },
      assert,
    };
  }

  return chain<INIT, INIT_REQUIRED>(initialAssert, (value) => value as INIT[]);
}
