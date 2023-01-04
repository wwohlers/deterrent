import { Assertable, Optional, TypeFromRequired, ValidationError } from './types';

type ValidatorsFromSchema<SCHEMA extends object> = {
  [KEY in keyof SCHEMA]: (value: unknown) => SCHEMA[KEY];
};

export type ObjectValidator<SCHEMA extends object, REQUIRED extends boolean> = {
  required: (_default?: SCHEMA) => ObjectValidator<SCHEMA, true>;
  schema: <NEW extends SCHEMA>(
    validators: ValidatorsFromSchema<NEW>,
    options?: { allOrNothing?: boolean; removeExtraneous?: boolean },
  ) => ObjectValidator<NEW, REQUIRED>;
} & Assertable<TypeFromRequired<SCHEMA, REQUIRED>>;

export function object<INIT extends object, INIT_REQUIRED extends boolean>(
  name: string = 'Value',
  options?: Partial<{
    initialAssert: (value: unknown) => TypeFromRequired<INIT, INIT_REQUIRED>;
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

  function chain<NEW extends INIT, REQUIRED extends boolean>(
    oldAssert: (value: unknown) => Optional<INIT>,
    fun: (value: Optional<INIT>) => TypeFromRequired<NEW, REQUIRED>,
  ): ObjectValidator<NEW, REQUIRED> {
    const assert = (value: unknown) => fun(oldAssert(value));
    return {
      required: (_default?: NEW) =>
        chain<NEW, true>(assert, (value) => {
          if (value === undefined || value === null) {
            if (_default) return _default;
            throw new ValidationError(name, 'is required');
          }
          return value as NEW;
        }),
      schema: <SCHEMA extends INIT>(
        schema: ValidatorsFromSchema<SCHEMA>,
        options?: { allOrNothing?: boolean; removeExtraneous?: boolean },
      ) => {
        const { allOrNothing, removeExtraneous } = {
          allOrNothing: false,
          ...options,
        };
        return chain<SCHEMA, REQUIRED>(assert, (value) => {
          if (value === undefined || value === null) {
            return value as TypeFromRequired<SCHEMA, REQUIRED>;
          }
          const result = {} as SCHEMA;
          const keys = Object.keys(schema);
          for (const key of keys) {
            try {
              result[key as keyof typeof result] = schema[key as keyof typeof schema](value[key as keyof typeof value]);
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

  return chain<INIT, INIT_REQUIRED>(initialAssert, (value) => value as TypeFromRequired<INIT, INIT_REQUIRED>);
}
