import { Assertable, ValidationError } from "./types";

export type ArrayValidator<EL> = {
  minLength: (minLength: number) => ArrayValidator<EL>;
  maxLength: (maxLength: number) => ArrayValidator<EL>;
  of: <NEW extends EL>(
    validator: (value: unknown) => NEW,
    options?: { allOrNothing?: boolean }
  ) => ArrayValidator<NEW>;
} & Assertable<EL[]>;

export function array<INIT>(
  name: string = "Value",
  options?: Partial<{
    coerce?: boolean;
    initialAssert?: (value: unknown) => INIT[];
  }>
) {
  const { coerce, initialAssert } = {
    coerce: false,
    initialAssert: (value: unknown) => {
      if (!Array.isArray(value)) {
        if (coerce) {
          return [value];
        }
        throw new ValidationError(name, "must be an array");
      }
      return value;
    },
    ...options,
  };

  function chain<NEW extends INIT>(
    oldAssert: (value: unknown) => INIT[],
    fun: (value: INIT[]) => NEW[]
  ): ArrayValidator<NEW> {
    const assert = (value: unknown) => fun(oldAssert(value));
    return {
      minLength: (minLength) =>
        chain<NEW>(assert, (value) => {
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
        return chain<EL>(assert, (value) => {
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

  return chain<INIT>(initialAssert, (value) => value);
}
