export class ValidationError extends Error {
  constructor(name: string, message: string) {
    super(name + " " + message);
    this.name = "ValidationError";
  }
}

export type Assertable<TYPE> = {
  assert: (value: unknown) => TYPE;
};

export type Optional<T> = T | null | undefined;