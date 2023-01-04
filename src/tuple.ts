import { Assertable, Optional, TypeFromRequired, ValidationError } from "./types";

type ValidatorsFromTuple<TUP extends [...unknown[]]> = {
  [INDEX in keyof TUP]: (value: unknown) => TUP[INDEX];
};

export type TupleValidator<E extends [...unknown[]], REQUIRED extends boolean> = {
  required: (_default?: E) => TupleValidator<E, true>;
  of: <TUP extends [...unknown[]]>(
    validators: ValidatorsFromTuple<TUP>
  ) => TupleValidator<TUP, REQUIRED>;
} & Assertable<TypeFromRequired<E, REQUIRED>>;

export function tuple<INIT extends [...unknown[]], INIT_REQUIRED extends boolean>(
  name: string = "Value",
  options?: Partial<{
    initialAssert: (value: unknown) => TypeFromRequired<INIT, INIT_REQUIRED>;
  }>
) {
  const { initialAssert } = {
    initialAssert: (value: unknown) => {
      if (!Array.isArray(value)) {
        throw new ValidationError(name, "must be an array");
      }
      return value;
    },
    ...options,
  };

  function chain<NEW extends [...unknown[]], REQUIRED extends boolean>(
    oldAssert: (value: unknown) => Optional<[...unknown[]]>,
    fun: (value: Optional<unknown[]>) => TypeFromRequired<NEW, REQUIRED>
  ): TupleValidator<NEW, REQUIRED> {
    const assert = (value: unknown) => fun(oldAssert(value));
    return {
      required: (_default?: NEW) =>
        chain<NEW, true>(assert, (value) => {
          if (value === undefined || value === null) {
            if (_default) return _default;
            throw new ValidationError(name, "is required");
          }
          return value as NEW;
        }),
      of: <TUP extends [...unknown[]]>(
        validators: ValidatorsFromTuple<TUP>,
        options?: { throwIfExtra?: boolean }
      ): TupleValidator<TUP, REQUIRED> => {
        const { throwIfExtra } = {
          throwIfExtra: false,
          ...options,
        };
        return chain<TUP, REQUIRED>(assert, (value) => {
          if (value === undefined || value === null) {
            return value as TypeFromRequired<TUP, REQUIRED>;
          }
          if (validators.length > value.length) {
            throw new ValidationError(
              name,
              `must contain at least ${validators.length} items`
            );
          }
          if (value.length > validators.length && throwIfExtra) {
            throw new ValidationError(
              name,
              `must contain at most ${validators.length} items`
            );
          }
          const res = [];
          for (let i = 0; i < validators.length; i++) {
            try {
              res.push(validators[i](value[i]));
            } catch (e) {
              throw new ValidationError(
                name,
                `item at tuple index ${i} is invalid: ${
                  (e as ValidationError).message
                }`
              );
            }
          }
          return res as TUP;
        });
      },
      assert,
    };
  }

  return chain<INIT, INIT_REQUIRED>(initialAssert, (value) => value as INIT);
}
