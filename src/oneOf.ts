import { Assertable } from "./types";
import { ValidationError } from "./ValidationError";

type ExtractType<AS extends Assertable<any>[]> = AS extends Assertable<infer TYPE>[] ? TYPE : never;

export function oneOf<AS extends Assertable<any>[]>(
  assertables: AS,
  options?: {
    name?: string
  }
): Assertable<ExtractType<AS>> {
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