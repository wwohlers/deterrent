import { Assertable } from './types';
import { ValidationError } from './ValidationError';

export type BooleanValidator<T extends boolean> = {
  true: (options?: { errorMessage?: string }) => BooleanValidator<true extends T ? true : never>;
  false: (options?: { errorMessage?: string }) => BooleanValidator<false extends T ? false : never>;
} & Assertable<T>;

export function boolean(initOptions?: { name?: string; coerce?: boolean; initialAssert?: (value: unknown) => boolean }) {
  const { name, coerce, initialAssert } = {
    name: 'Value',
    coerce: false,
    initialAssert: (value: unknown) => {
      if (typeof value !== 'boolean') {
        if (coerce) {
          return Boolean(value);
        }
        throw new ValidationError(`${name} must be a boolean`);
      }
      return value;
    },
    ...initOptions,
  };

  function chain<T extends boolean>(assert: (value: unknown) => T): BooleanValidator<T> {
    const next = <NEXT extends boolean>(nextFunction: (value: T) => NEXT) =>
      chain<NEXT>((value) => nextFunction(assert(value)));
    return {
      true: (options) =>
        next<true extends T ? true : never>((value) => {
          if (!value) {
            throw new ValidationError(options?.errorMessage ?? `${name} must be true`);
          }
          return value as true extends T ? true : never;
        }),
      false: (options) =>
        next<false extends T ? false : never>((value) => {
          if (value) {
            throw new ValidationError(options?.errorMessage ?? `${name} must be false`);
          }
          return value as false extends T ? false : never;
        }),
      assert,
    };
  }

  return chain<boolean>(initialAssert);
}
