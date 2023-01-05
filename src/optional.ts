import { Assertable } from "./types";

export function optional<TYPE>(
  assertable: Assertable<TYPE>,
  defaultValue?: TYPE,
): Assertable<TYPE | undefined | null> {
  return {
    assert: (value: unknown) => {
      if (value === undefined || value === null) {
        if (defaultValue !== undefined) {
          return defaultValue;
        }
      }
      return assertable.assert(value);
    },
  };
}