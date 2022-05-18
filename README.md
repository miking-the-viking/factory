# Factory

A Typesafe package to simplify initializing models using TypeScript and Decorators.

## Use

### Add the @FactoryModel decorator to identify a class that should be able to be factoried

This class will need to implement a static `fromJSON` method that takes an object of the required parameters and returns a `new` instance of the class.

### Add the @FactoryDefault decorator to add defaults to required class properties

This will set the default value for required constructor parameters

### Use `factory`

Use the `factory` method by passing in the registered model and invoke the returned factory.

```typescript
@FactoryModel
class User {
  @FactoryDefault('123')
  public id!: string;

  constructor(id: string) {
    this.id = id;
  }

  static fromJSON({ id }: User) {
    return new User(id);
  }
}

// then use the `factory` method in your tests!

// all defaults - User { id: '123' }
const user = factory(User)();

// optional overrides - User { id: 'scooby-doo' }
const user = factory(User)({ id: 'scooby-doo' });
```
