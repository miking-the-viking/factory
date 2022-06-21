import { FactoryDefault, FactoryModel, factory } from './factory';
@FactoryModel
class MyClass {
  @FactoryDefault('default id')
  public id: string;

  @FactoryDefault('default name')
  public name: string;

  @FactoryDefault('default value', {
    dependsOn: [
      'id',
      'name',
      ({ id, name }) =>
        `default value depending on other fieds ${id} and ${name}`,
    ],
  })
  public other: string;

  constructor(id: string, name: string, other: string) {
    this.id = id;
    this.name = name;
    this.other = other;
  }

  static fromJSON({ id, name, other }: MyClass) {
    return new MyClass(id, name, other);
  }
}

describe('factory', () => {
  let myInstance!: MyClass;

  describe('All default', () => {
    beforeEach(() => {
      myInstance = factory(MyClass)();
    });
    it('Should produce an instance of the class', () => {
      expect(myInstance).toBeInstanceOf(MyClass);
    });
    it('Should use the defaults', () => {
      expect(myInstance.id).toEqual('default id');
      expect(myInstance.name).toEqual('default name');
    });
    it('Should use the dependsOn', () => {
      expect(myInstance.other).toEqual(
        `default value depending on other fieds default id and default name`
      );
    });
  });

  describe('With overrides', () => {
    const nameOverride = 'some new name';
    beforeEach(() => {
      myInstance = factory(MyClass)({
        name: nameOverride,
      });
    });
    it('Should produce an instance of the class', () => {
      expect(myInstance).toBeInstanceOf(MyClass);
    });
    it('Should use the defaults for non-overrode values', () => {
      expect(myInstance.id).toEqual('default id');
    });
    it('Should use the override', () => {
      expect(myInstance.name).toEqual(nameOverride);
    });
    it('Should use the dependsOn', () => {
      expect(myInstance.other).toEqual(
        `default value depending on other fieds default id and ${nameOverride}`
      );
    });
  });
});
