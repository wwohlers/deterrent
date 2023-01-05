import { Assertable, ValidationError } from './types';

export type BooleanValidator = {
  true: () => BooleanValidator;
  false: () => BooleanValidator;
} & Assertable<boolean>;

export function boolean(
  name: string = 'Value',
  options?: Partial<{
    coerce?: boolean;
    initialAssert: (value: unknown) => boolean;
  }>,
) {
  const { coerce, initialAssert } = {
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

  function chain(oldAssert: (value: unknown) => boolean, fun: (value: boolean) => boolean): BooleanValidator {
    const assert = (value: unknown) => fun(oldAssert(value));
    return {
      true: () =>
        chain(assert, (value) => {
          if (!value) {
            throw new ValidationError(name, 'must be true');
          }
          return value;
        }),
      false: () =>
        chain(assert, (value) => {
          if (value) {
            throw new ValidationError(name, 'must be false');
          }
          return value;
        }),
      assert,
    };
  }

  return chain(initialAssert, (value) => value);
}
