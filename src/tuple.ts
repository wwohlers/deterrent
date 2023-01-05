import { Assertable, ValidationError } from "./types";

type ValidatorsFromTuple<TUP extends [...unknown[]]> = {
  [INDEX in Exclude<keyof TUP, 'length'>]: (value: unknown) => TUP[INDEX];
} & unknown[];

export type TupleValidator<E extends [...unknown[]]> = {
  of: <TUP extends E>(
    validators: ValidatorsFromTuple<TUP>
  ) => TupleValidator<TUP>;
} & Assertable<E>;

export function tuple<INIT extends [...unknown[]]>(
  name: string = "Value",
  options?: Partial<{
    initialAssert: (value: unknown) => INIT;
  }>
) {
  const { initialAssert } = {
    initialAssert: (value: unknown) => {
      if (!Array.isArray(value)) {
        throw new ValidationError(name, "must be an array");
      }
      return value as INIT;
    },
    ...options,
  };

  function chain<NEW extends INIT>(
    oldAssert: (value: unknown) => INIT,
    fun: (value: INIT) => NEW
  ): TupleValidator<NEW> {
    const assert = (value: unknown) => fun(oldAssert(value));
    return {
      of: <TUP extends INIT>(
        validators: ValidatorsFromTuple<TUP>,
        options?: { throwIfExtra?: boolean }
      ): TupleValidator<TUP> => {
        const { throwIfExtra } = {
          throwIfExtra: false,
          ...options,
        };
        return chain<TUP>(assert, (value) => {
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

  return chain<INIT>(initialAssert, (value) => value);
}
