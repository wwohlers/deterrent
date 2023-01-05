export type Assertable<TYPE> = {
  assert: (value: unknown) => TYPE;
};

export type Optional<T> = T | null | undefined;