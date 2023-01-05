import { Assertable } from './types';
import { ValidationError } from './ValidationError';

export type BooleanValidator = {
  true: () => BooleanValidator;
  false: () => BooleanValidator;
} & Assertable<boolean>;

export function boolean(
  options?: {
    name?: string;
    coerce?: boolean;
    initialAssert?: (value: unknown) => boolean;
  },
) {
  const { name, coerce, initialAssert } = {
    name: 'Value',
    coerce: false,
    initialAssert: (value: unknown) => {
      if (typeof value !== 'boolean') {
        if (coerce) {
          return Boolean(value);
        }
        throw new ValidationError(name, 'must be a boolean');
      }
      return value;
    },
    ...options,
  };

  function chain(assert: (value: unknown) => boolean): BooleanValidator {
    const next = (nextFunction: (value: boolean) => boolean) => chain((value) => nextFunction(assert(value)));
    return {
      true: () =>
        next((value) => {
          if (!value) {
            throw new ValidationError(name, 'must be true');
          }
          return value;
        }),
      false: () =>
        next((value) => {
          if (value) {
            throw new ValidationError(name, 'must be false');
          }
          return value;
        }),
      assert,
    };
  }

  return chain(initialAssert);
}
