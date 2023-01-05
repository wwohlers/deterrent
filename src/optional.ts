import { Assertable } from './types';
import { ValidationError } from './ValidationError';

type ConditionalType<T, U extends boolean> = U extends true ? T : never;

export function optional<TYPE, NULL extends boolean, UNDEF extends boolean>(
  assertable: Assertable<TYPE>,
  options?: {
    name?: string;
    defaultValue?: TYPE;
    allowNull?: NULL;
    allowUndefined?: UNDEF;
  },
): Assertable<TYPE | ConditionalType<null, NULL> | ConditionalType<undefined, UNDEF>> {
  const { name, defaultValue, allowNull, allowUndefined } = {
    name: "Value",
    defaultValue: undefined,
    allowNull: true,
    allowUndefined: true,
    ...options,
  };
  return {
    assert: (value: unknown) => {
      if (value === undefined) {
        if (!allowUndefined) {
          throw new ValidationError(name, 'must not be undefined');
        }
        return defaultValue ?? undefined as ConditionalType<undefined, UNDEF>;
      } else if (value === null) {
        if (!allowNull) {
          throw new ValidationError(name, 'must not be null');
        }
        return defaultValue ?? null as ConditionalType<null, NULL>;
      }
      return assertable.assert(value);
    },
  };
}
