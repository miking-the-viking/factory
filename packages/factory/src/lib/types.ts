/**
 * Utility type for defining a construtor
 */
export type ConstructorType<R> = R extends { new (...args: any[]): {} }
  ? R
  : never;

/**
 * The factory requires a way to initialize the model from JSON for easy key overrides.
 * The fromJSON method must take in an object of model parameters, and return a new instance of the model
 */
export type ConstructorTypeWithFromJSON<R> = ConstructorType<R> & {
  fromJSON(args: Record<string, any>): {};
};

/**
 * Map of a class constructor and its parameters default values for the factory
 */
export type FactoryConfig<R> = {
  class: ConstructorTypeWithFromJSON<R>;
  defaults: Parameters<ConstructorTypeWithFromJSON<R>['fromJSON']>;
};

/**
 * Map of all class FactoryConfigs
 */
export type FactoryMap<T> = Record<string, FactoryConfig<T>>;
