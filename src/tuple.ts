import { Assertable } from './types';
import { ValidationError } from './ValidationError';

type ValidatorsFromTuple<TUP extends any[]> = [
  ...{
    [INDEX in keyof TUP]: Assertable<TUP[INDEX]>;
  },
];

export type TupleValidator<TUP extends any[]> = {
  of: <NEXT extends TUP>(
    assertables: ValidatorsFromTuple<NEXT>,
    options?: { throwIfExtra?: boolean },
  ) => TupleValidator<NEXT>;
} & Assertable<TUP>;

export function tuple<INIT extends any[]>(
  options?: {
    name?: string;
    initialAssert?: (value: unknown) => INIT;
  },
) {
  const { name, initialAssert } = {
    name: 'Value',
    initialAssert: (value: unknown) => {
      if (!Array.isArray(value)) {
        throw new ValidationError(name, 'must be an array');
      }
      return value as INIT;
    },
    ...options,
  };

  function chain<TUP extends INIT>(assert: (value: unknown) => TUP): TupleValidator<TUP> {
    const next = <NEXT extends INIT>(nextFunction: (value: INIT) => NEXT) =>
      chain<NEXT>((value: unknown) => nextFunction(assert(value)));
    return {
      of: <NEXT extends TUP>(
        assertables: ValidatorsFromTuple<NEXT>,
        options?: { throwIfExtra?: boolean },
      ): TupleValidator<NEXT> => {
        const { throwIfExtra } = {
          throwIfExtra: true,
          ...options,
        };
        return next<NEXT>((value) => {
          if (assertables.length > value.length) {
            throw new ValidationError(name, `must contain exactly ${assertables.length} items`);
          }
          if (value.length > assertables.length && throwIfExtra) {
            throw new ValidationError(name, `must contain exactly ${assertables.length} items`);
          }
          const res = [];
          for (let i = 0; i < assertables.length; i++) {
            try {
              res.push(assertables[i].assert(value[i]));
            } catch (e) {
              throw new ValidationError(name, `item at tuple index ${i} is invalid: ${(e as ValidationError).message}`);
            }
          }
          return res as NEXT;
        });
      },
      assert,
    };
  }

  return chain<INIT>(initialAssert);
}
