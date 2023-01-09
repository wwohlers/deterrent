import { Assertable } from './types';
import { ValidationError } from './ValidationError';

type ValidatorsFromSchema<SCHEMA extends Record<any, any>> = {
  [KEY in keyof SCHEMA]: Assertable<SCHEMA[KEY]>;
};

export type ObjectValidator<SCHEMA extends Record<any, any>> = {
  schema: <NEXT extends SCHEMA>(validators: ValidatorsFromSchema<NEXT>) => ObjectValidator<NEXT>;
} & Assertable<SCHEMA>;

export function object<INIT extends Record<any, any>>(initOptions?: {
  name?: string;
  initialAssert?: (value: unknown) => INIT;
}) {
  const { name, initialAssert } = {
    name: 'Value',
    initialAssert: (value: unknown) => {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new ValidationError(`${name} must be an object`);
      }
      return value as INIT;
    },
    ...initOptions,
  };

  function chain<SCHEMA extends INIT>(assert: (value: unknown) => SCHEMA): ObjectValidator<SCHEMA> {
    const next = <NEXT extends SCHEMA>(nextFunction: (value: SCHEMA) => NEXT) =>
      chain((value) => nextFunction(assert(value)));
    return {
      schema: <NEXT extends SCHEMA>(assertableSchema: ValidatorsFromSchema<NEXT>) => {
        return next<NEXT>((value) => {
          const result = {} as SCHEMA;
          for (const key in assertableSchema) {
            if (assertableSchema.hasOwnProperty(key)) {
              const propertyValue = key in value ? value[key as keyof typeof value] : undefined;
              const assertable = assertableSchema[key];
              result[key] = assertable.assert(propertyValue);
            }
          }
          return result;
        });
      },
      assert,
    };
  }

  return chain<INIT>(initialAssert);
}
