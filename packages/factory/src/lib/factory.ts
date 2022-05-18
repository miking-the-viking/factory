/* eslint-disable @typescript-eslint/ban-types */
import 'reflect-metadata';

/**
 * Utility type for defining a construtor
 */
type ConstructorType<R> = R extends { new (...args: any[]): {} } ? R : never;

/**
 * The factory requires a way to initialize the model from JSON for easy key overrides.
 * The fromJSON method must take in an object of model parameters, and return a new instance of the model
 */
type ConstructorTypeWithFromJSON<R> = ConstructorType<R> & {
  fromJSON(args: Record<string, any>): {};
};

/**
 * Map of a class constructor and its parameters default values for the factory
 */
type FactoryConfig<R> = {
  class: ConstructorTypeWithFromJSON<R>;
  defaults: Parameters<ConstructorTypeWithFromJSON<R>['fromJSON']>;
  options: Options<any>;
};

/**
 * Map of all class FactoryConfigs
 */
type FactoryMap<T> = Record<string, FactoryConfig<T>>;

const FACTORIES: FactoryMap<any> = {};
const PROPERTY_KEY = Symbol('factories');

/**
 * Retrieves the factory config from FACTORIES, or throws an error
 */
function getFactoryConfig<T>(Target: ConstructorTypeWithFromJSON<T>) {
  console.log(FACTORIES);
  if (!FACTORIES[Target.name])
    throw Error(
      `${Target.name} is not a registered factory class. Add the @FactoryModel decorator to it`
    );
  return FACTORIES[Target.name];
}

type Options<Params extends string> = {
  dependsOn?: [...Params[], (fields: Record<Params, any>) => any];
};

/**
 * Use this decorator to set a default value for class properties that need to be factoried
 */
export function FactoryDefault<Params extends string>(
  defaultValue: any,
  // TODO: Working on opts to add `dependsOn` syntax
  // TODO: need object syntax that we can get multiple inputs such as patientFactory's fhirPatient depending on
  opts?: Options<Params>
): PropertyDecorator {
  return (target, property) => {
    console.log(opts);
    const classConstructor = target.constructor;
    const metadata = Reflect.getMetadata(PROPERTY_KEY, classConstructor) || {};
    metadata[property] = { defaultValue, options: opts };
    Reflect.defineMetadata(PROPERTY_KEY, metadata, classConstructor);
  };
}

/**
 * Decorator to register a class as a model that should be used with the `factory` calls
 */
export function FactoryModel<T>(Target: ConstructorTypeWithFromJSON<T>) {
  const classMetadata = Reflect.getMetadata(PROPERTY_KEY, Target);
  console.log(classMetadata);
  const { defaults, options } = Object.keys(classMetadata).reduce(
    (acc, key) => {
      acc.defaults[key] = classMetadata[key].defaultValue;
      acc.options[key] = classMetadata[key].options;

      return acc;
    },
    { defaults: {}, options: {} } as any
  );
  FACTORIES[Target.name] = {
    class: Target,
    defaults,
    options,
  };

  return Target;
}

/**
 * Factory call for magical factories
 *
 * Requirements:
 *
 * 1. Ensure that a `fromJSON` method is statically available on the model
 * ```typescript
 *static fromJSON({ id, name }: User) {
    return new User(id, name)
  }
 * ```
 * 2. Add the FactoryModel decorator to the Class
 * 3. Add the FactoryDefault decorator to all properties requiring a defined default
 * 4. Use!
 *   - With no overrides, only defaults - `factory(User)()`
 *   - With optional overrides - `factory(User)({id: 'override-id'})
 */
export function factory<
  T extends { new (...args: any[]): InstanceType<T> } & {
    fromJSON(args: Record<string, any>): {};
  }
>(Target: ConstructorTypeWithFromJSON<T>) {
  const { class: Class, defaults, options } = getFactoryConfig(Target);

  // need default params dependsOn

  // defaults can depend on 1...N other fields, sorting by length of required parameters would be ideal
  const dependsOnLeastToMost = Object.keys(defaults).sort((a, b) => {
    const [A, B] = [(options as any)[a], (options as any)[b]]; /* ? */
    return A?.dependsOn.length < B?.dependsOn.length
      ? -1
      : A?.dependsOn.length > B?.dependsOn.length
      ? 1
      : 0;
  });

  const factoryCall = (args: Partial<InstanceType<T>> = {}) =>
    Class.fromJSON({
      ...(() => {
        const defaultsWithDepends = dependsOnLeastToMost.reduce((acc, key) => {
          (acc as any)[key] = (args as any)[key] ?? defaults[key as any];
          const opts = (options as any)[key] as Options<any>;
          if (opts) {
            const { dependsOn } = opts;

            if (dependsOn && dependsOn.length > 0) {
              const func = dependsOn[dependsOn.length - 1];
              const dependedOnObject = dependsOn
                .slice(0, dependsOn.length - 2)
                .reduce(
                  (acc2, key2) => ({ ...acc2, [key2]: (acc as any)[key2] }),
                  acc
                );

              const value = func(dependedOnObject);
              if (value) (acc as any)[key] = value;
            }
          }

          return acc;
        }, {});

        return defaultsWithDepends;
      })(),
      ...args,
    });

  return factoryCall;
}

// =====================================================================
// Sample Classes
// =====================================================================

// @FactoryModel
// class User2 {
//   @FactoryDefault('abc-123')
//   public id!: string

//   @FactoryDefault('thing')
//   public thing!: string

//   @FactoryDefault('this is my default name', {
//     dependsOn: [
//       'id',
//       'thing',
//       ({ id, thing }: { id: string; thing: string }) =>
//         `name is id ${id} and thing is ${thing}`
//     ]
//   })
//   public name!: string

//   constructor(id: string, name: string, thing: string) {
//     this.id = id
//     this.name = name
//     this.thing = thing
//   }

//   /**
//    * fromJSON method must be implemented and present
//    */
//   static fromJSON({ id, name, thing }: User2) {
//     return new User2(id, name, thing)
//   }
// }

// factory(User2)({ id: 'tester' }) /* ? */
