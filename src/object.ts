import { Assertable, ValidationError } from './types';

type ValidatorsFromSchema<SCHEMA extends Record<any, any>> = {
  [KEY in keyof SCHEMA]: Assertable<SCHEMA[KEY]>;
};

export type ObjectValidator<SCHEMA extends Record<any, any>> = {
  schema: <NEW extends SCHEMA>(
    validators: ValidatorsFromSchema<NEW>,
    options?: { allOrNothing?: boolean; removeExtraneous?: boolean },
  ) => ObjectValidator<NEW>;
} & Assertable<SCHEMA>;

export function object<INIT extends Record<any, any>>(
  name: string = 'Value',
  options?: Partial<{
    initialAssert: (value: unknown) => INIT;
  }>,
) {
  const { initialAssert } = {
    initialAssert: (value: unknown) => {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new ValidationError(name, 'must be an object');
      }
      return value as INIT;
    },
    ...options,
  };

  function chain<NEW extends INIT>(
    oldAssert: (value: unknown) => INIT,
    fun: (value: INIT) => NEW,
  ): ObjectValidator<NEW> {
    const assert = (value: unknown) => fun(oldAssert(value));
    return {
      schema: <SCHEMA extends INIT>(
        schema: ValidatorsFromSchema<SCHEMA>,
        options?: { allOrNothing?: boolean; },
      ) => {
        const { allOrNothing } = {
          allOrNothing: false,
          ...options,
        };
        return chain<SCHEMA>(assert, (value) => {
          const result = {} as SCHEMA;
          for (const key in schema) {
            const propertyValue = key in value ? value[key as keyof typeof value] : undefined;
            try {
              const assertable = schema[key];
              result[key] = assertable.assert(propertyValue);
            } catch (error) {
              if (allOrNothing) {
                throw error;
              }
            }
          }
          return result;
        });
      },
      assert,
    };
  }

  return chain<INIT>(initialAssert, (value) => value);
}
