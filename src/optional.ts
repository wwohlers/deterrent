import { Assertable } from './types';
import { ValidationError } from './ValidationError';

type ConditionalType<T, U extends boolean> = U extends true ? T : never;

export function optional<TYPE, NULL extends boolean = false, UNDEF extends boolean = true>(
  assertable: Assertable<TYPE>,
  options?: {
    name?: string;
    errorMessage?: string;
    defaultValue?: TYPE;
    allowNull?: NULL;
    allowUndefined?: UNDEF;
  },
): Assertable<TYPE | ConditionalType<null, NULL> | ConditionalType<undefined, UNDEF>> {
  const { name, defaultValue, allowNull, allowUndefined, errorMessage } = {
    name: "Value",
    defaultValue: undefined,
    allowNull: false,
    allowUndefined: true,
    ...options,
  };
  return {
    assert: (value: unknown) => {
      if (value === undefined) {
        if (!allowUndefined) {
          throw new ValidationError(errorMessage ?? `${name} must not be undefined`);
        }
        return defaultValue ?? undefined as ConditionalType<undefined, UNDEF>;
      } else if (value === null) {
        if (!allowNull) {
          throw new ValidationError(errorMessage ?? `${name} must not be null`);
        }
        return defaultValue ?? null as ConditionalType<null, NULL>;
      }
      return assertable.assert(value);
    },
  };
}
