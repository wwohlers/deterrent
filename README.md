# CalmJS

CalmJS is a type-safe, functional data validation library with no dependencies.

## Assertable

The essential type exposed by CalmJS is an assertable. 

An `Assertable<T>` is an object whose member `assert` is a function that accepts a parameter of type `unknown` and returns a value of type `T` or throws a `ValidationError`.

For example, an `Assertable<string>` looks like this:

```
{
	assert: (value: unknown) => string;
}
```

Any unvalidated value can be passed into the `assert` function. If the value passes all validation checks, it is returned as type `string`, since the assertable at least guarantees that `value` is a string. If the value is not a string, or fails any further validation checks (such as matching a regex pattern), the function will throw a `ValidationError` containing a message describing why the value was invalid. 

# API

## NumberValidator
A validator for values of type `number`.

### number(options)
Creates a `NumberValidator`.

`options.name: string` -- the name for the validator used in error messages. Defaults to `"Value"`.

`options.allowNumericString: boolean` -- whether to allow numeric strings as input, which are immediately converted to type `number`. Defaults to `true`.

`options.initialAssert` -- see the **Initial Assert** section at the end.

### NumberValidator.min(minValue: number)
Checks that the number is at least `minValue`.

### NumberValidator.max(maxValue: number)
Checks that the number is at most `maxValue`.

### NumberValidator.integer(options)
Checks that the number is an integer.

`options.roundIfNot: boolean` -- if the value is not an integer, rounds to the nearest integer and continues instead of throwing an error. Defaults to true.

`options.divisibleBy: number` -- requires that the value (after being rounded, if applicable) is divisible by the given number.

### NumberValidator.custom(validator)
See the **Custom Validator Function** section below.

### NumberValidator.asString()
Converts the value to a string by calling `toString()`, and returns a `StringValidator`. 

### NumberValidator.assert(value)
Calls the validation chain; returns the value if it passes all checks, or throws a `ValidationError` if it fails.

## StringValidator
A validator for values of type `string`.

### string(options)
Creates a `StringValidator`.

`options.name: string` -- the name for the validator used in error messages. Defaults to `"Value"`.

`options.initialAssert` -- see the **Initial Assert** section at the end.

### StringValidator.minLength(minLength)
Checks that the string's length is at least `minLength` characters.

### StringValidator.maxLength(maxLength)
Checks that the string's length is at most `maxLength` characters.

### StringValidator.pattern(pattern: RegExp)
Checks that the string satisfies the given pattern.

### StringValidator.custom(validator)
See the **Custom Validator Function** section below.

### StringValidator.split(separator, options)
Splits the string by the given separator and returns an `ArrayValidator<string>`.

`options.listName: string` -- the name for the new array validator. 

### StringValidator.assert(value)
Calls the validation chain; returns the value if it passes all checks, or throws a `ValidationError` if it fails.

## BooleanValidator
A validator for values of type `boolean`.

### boolean(options)
Creates a `BooleanValidator`.

`options.name: string` -- the name for the validator used in error messages. Defaults to `"Value"`.

`options.coerce: boolean` -- whether to coerce the unknown value into a boolean using truthiness. If false, any non-boolean values will immediately cause an error to be thrown. Defaults to `false`.

`options.initialAssert` -- see the **Initial Assert** section at the end.

### BooleanValidator.true()
Checks that the boolean is `true`.

### BooleanValidator.false()
Checks that the boolean is `false`.

### BooleanValidator.assert(value)
Calls the validation chain; returns the value if it passes all checks, or throws a `ValidationError` if it fails.

## ArrayValidator\<EL>
A validator for values of type `EL[]`, i.e., arrays whose elements are of type `EL`.

### array\<INIT>(options)
Creates an `ArrayValidator<INIT>`. `INIT` will default to `unknown[]` unless `options.initialAssert` is specified. In either case, it should be inferred, so you'll rarely need to specify this type parameter.

`options.name: string` -- the name for the validator used in error messages. Defaults to `"Value"`.

`options.coerce: boolean` -- whether to coerce the given value into an array. Defaults to false. If true, the initial assert function behaves as follows:

1) If the value is `null` or `undefined`, returns `[]` (an empty array).
2) If the value is anything else (except an array), returns `[value]` (i.e., an array with `value` as its only item).

`options.initialAssert` -- see the **Initial Assert** section at the end.

### array.minLength(minLength)
Checks that the array has at least `minLength` elements.

### array.maxLength(maxLength)
Checks that the array has at most `maxLength` elements.

### of\<NEXT>(assertable: Assertable\<NEXT>, options)
Checks that the elements of the array pass the given assertable.

`options.allOrNothing: boolean` -- if true, an element that fails to pass the assertable will cause the entire check to fail. If false, the element will simply be omitted from the array. Either way, the resulting array will only contain elements that passed the given assertable. Defaults to `true`.

### custom(validator)
See the **Custom Validator Function** section below.

### ArrayValidator.assert(value)
Calls the validation chain; returns the value if it passes all checks, or throws a `ValidationError` if it fails.

## TupleValidator\<TUP extends any[]>
A validator for tuple types, i.e., arrays with a fixed size that satisfy the type `TUP`.

`options.name: string` -- the name for the validator used in error messages. Defaults to `"Value"`.

`options.initialAssert` -- see the **Initial Assert** section at the end.

### tuple\<INIT>(options)
Creates a `TupleValidator\<INIT>`. `INIT` will default to `any[]` unless `options.initialAssert` is specified. In either case, it should be inferred, so you'll rarely need to specify this type parameter.

### TupleValidator.of\<NEXT>(assertables, options)
Checks that the elements of the tuple exactly match the given assertables. If there are fewer elements than assertables, an error is thrown. 

`assertables` is an array of assertables, where each element in `value` is checked against the assertable in its corresponding index.

`options.throwIfExtra: boolean` -- if true, throws if there are more elements than assertables. If false, the extra elements are simply omitted from the resulting array. Defaults to `true`.

### TupleValidator.assert(value)
Calls the validation chain; returns the value if it passes all checks, or throws a `ValidationError` if it fails.

## ObjectValidator\<SCHEMA extends Record<any, any>>
A validator for object types, i.e., anything that extends `Record<any, any>`. Even though `null` and arrays are technically considered objects, **they will fail `ObjectValidator`'s initial check**.

### object\<INIT>(options)
Creates an `ObjectValidator\<INIT>`. `INIT` will default to `Record<any, any>` unless `options.initialAssert` is specified. In either case, it should be inferred, so you'll rarely need to specify this type parameter.

`options.name: string` -- the name for the validator used in error messages. Defaults to `"Value"`.

`options.initialAssert` -- see the **Initial Assert** section at the end.

### ObjectValidator.schema\<NEXT>(assertableSchema)
Checks that the object specifies the given schema of assertables. 

`assertableSchema` is a `NEXT` whose values are mapped to be assertables of their base types. For example, if you'd like to check that an object is of type

```
{ 
  name: string; 
  age: number;
}
```
you can call `ObjectValidator.schema` with the following argument:
```
{
  name: string(),
  age: number(),
}
```

For keys that are optional, use the `optional` utility validator (see below).

### ObjectValidator.assert(value)
Calls the validation chain; returns the value if it passes all checks, or throws a `ValidationError` if it fails.

## optional\<TYPE>(assertable, options)
Wraps the given assertable, allowing `null` or `undefined` values. Do not specify type parameters as they will be inferred.

`options.name: string` -- name of optional assertable, used in error messages. Defaults to `"Value"`.

`options.defaultValue: TYPE` -- a default value to use if the value is `null` or `undefined`. If no default value is provided, the respective value (`null` or `undefined`) will pass.

`options.allowNull?: boolean` -- whether to allow `null` values to pass. If false and no default value is provided, a value of `null` will cause the check to fail. Defaults to `true`.

`options.allowUndefined?: boolean` -- whether to allow `undefined` values to pass. If false and no default value is provided, a value of `undefined` will cause the check to fail. Defaults to `true`.

## oneOf(assertables, options)
Wraps the given assertables, allowing values that satisfy any of the given assertables. Do not specify the type parameter as it will be inferred.

`options.name: string` -- the name of the oneOf assertable, used in error messages. Defaults to `"Value"`.

## Initial Assert
All functions that create validators (`number()`, `string()`, etc) must provide an *initial assert* function. This function should accept a parameter of type `unknown` and return a type that extends its respective type. For example, an initial assert function for `number()` will typically return a `number`, but may return the type `1 | 2 | 3 | 4 | 5`.

The default initial assert functions are appropriate for almost all use cases. In rare cases, you may want to combine validators of different types -- for example, taking the result from a `NumberValidator`, converting it to a `boolean`, and using that value for a `BooleanValidator`. In that case, pass to the `BooleanValidator` an initial assert function that calls `NumberValidator.assert()`, converts the result to a `boolean`, and returns it.

## Custom Validator Function
To write your own check, simply pass in a validator function, which looks like this for a type `T`:

```
validator: (value: T, error: (message: string) => void) => T)
```

This function should perform any validation checks and return the value if it passes. If it fails, it should call `error` and pass in a descriptive error message, which will cause the entire validation chain to fail.
