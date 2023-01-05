import { Assertable, ValidationError } from "./types";

export function oneOf<TYPE>(
  assertables: Assertable<TYPE>[],
  options?: {
    name?: string
  }
): Assertable<TYPE> {
  const { name } = {
    name: "Value",
    ...options,
  };
  return {
    assert: (value: unknown) => {
      for (const assertable of assertables) {
        try {
          return assertable.assert(value);
        } catch (error) {
          // pass
        }
      }
      throw new ValidationError(name, "must be one of the given types");
    },
  };
}