import { Assertable } from './types';
import { ValidationError } from './ValidationError';

export type ArrayValidator<EL> = {
  minLength: (minLength: number, options?: { errorMessage?: string }) => ArrayValidator<EL>;
  maxLength: (maxLength: number, options?: { errorMessage?: string, truncate?: boolean }) => ArrayValidator<EL>;
  of: <NEXT extends EL>(
    assertable: Assertable<NEXT>,
    options?: { errorMessage?: string, allOrNothing?: boolean },
  ) => ArrayValidator<NEXT>;
  custom: <NEXT extends EL>(
    validator: (value: EL[], error: (errorMessage: string) => void) => NEXT[],
  ) => ArrayValidator<NEXT>;
} & Assertable<EL[]>;

export function array<INIT>(initOptions?: { name?: string; coerce?: boolean; initialAssert?: (value: unknown) => INIT[] }) {
  const { name, coerce, initialAssert } = {
    name: 'Value',
    coerce: false,
    initialAssert: (value: unknown) => {
      if (!Array.isArray(value)) {
        if (coerce) {
          if (value === undefined || value === null) {
            return [];
          }
          return [value];
        }
        throw new ValidationError(`${name} must be an array`);
      }
      return value;
    },
    ...initOptions,
  };

  function chain<EL extends INIT>(assert: (value: unknown) => EL[]): ArrayValidator<EL> {
    const next = <NEXT extends INIT>(nextFunction: (value: EL[]) => NEXT[]) =>
      chain<NEXT>((value: unknown) => nextFunction(assert(value)));
    return {
      minLength: (minLength, options) =>
        next((value) => {
          if (value.length < minLength) {
            throw new ValidationError(options?.errorMessage ?? `${name} must contain at least ${minLength} items`);
          }
          return value;
        }),
      maxLength: (maxLength, options) =>
        next((value) => {
          if (value.length > maxLength) {
            if (options?.truncate) {
              return value.slice(0, maxLength) as EL[];
            }
            throw new ValidationError(options?.errorMessage ?? `${name} must contain at most ${maxLength} items`);
          }
          return value;
        }),
      of: <NEXT extends EL>(assertable: Assertable<NEXT>, options?: { errorMessage?: string, allOrNothing?: boolean }) => {
        const { allOrNothing, errorMessage } = {
          allOrNothing: true,
          ...options,
        };
        return next<NEXT>((value) => {
          const res = [];
          for (let i = 0; i < value.length; i++) {
            try {
              res.push(assertable.assert(value[i]));
            } catch (e) {
              if (allOrNothing) {
                throw new ValidationError(
                  errorMessage ?? `${name} item at index ${i} is invalid: ${(e as ValidationError).message}`,
                );
              }
            }
          }
          return res as NEXT[];
        });
      },
      custom: <NEXT extends EL>(validator: (value: EL[], error: (message: string) => void) => NEXT[]) =>
        next<NEXT>((value) => {
          return validator(value, (message: string) => {
            throw new ValidationError(message);
          });
        }),
      assert,
    };
  }

  return chain<INIT>(initialAssert);
}
