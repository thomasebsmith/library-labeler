export class AssertionError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "AssertionError";
  }
}

export function assert(condition: boolean, msg: string): asserts condition {
  if (!condition) {
    throw new AssertionError(msg);
  }
}

export function fatalError(msg: string): never {
  assert(false, msg);
}

export function never(msg: never): never {
  fatalError(msg);
}

export function showError(error: unknown) {
  console.error(error);
  if (error instanceof Error) {
    alert(error.message);
  }
}

export function showErrors(func: () => void) {
  try {
    func();
  } catch (error: unknown) {
    showError(error);
  }
}

const hasOwnProperty = Object.prototype.hasOwnProperty;

export function hasProp<Key extends PropertyKey>(
  object: object,
  propertyName: Key
): object is Record<Key, unknown> {
  return hasOwnProperty.call(object, propertyName);
}
