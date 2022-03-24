// An error because of invalid state.
export class AssertionError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "AssertionError";
  }
}

// If condition is false, throws an AssertionError with the message msg.
export function assert(condition: boolean, msg: string): asserts condition {
  if (!condition) {
    throw new AssertionError(msg);
  }
}

// Throws an AssertionError with the message msg.
export function fatalError(msg: string): never {
  assert(false, msg);
}

// Invalid function. Call in places that can be statically determined to never
// execute.
export function never(msg: never): never {
  fatalError(msg);
}

// Prints error to the console and alerts the user if it is an Error instance.
export function showError(error: unknown) {
  console.error(error);
  if (error instanceof Error) {
    alert(error.message);
  }
}

// Shows any error that occurs when executing func.
export function showErrors(func: () => void) {
  try {
    func();
  } catch (error: unknown) {
    showError(error);
  }
}

const hasOwnProperty = Object.prototype.hasOwnProperty;

// Returns whether object has a property called propertyName.
export function hasProp<Key extends PropertyKey>(
  object: object,
  propertyName: Key
): object is Record<Key, unknown> {
  return hasOwnProperty.call(object, propertyName);
}

type AsyncFunc<K, R> = (key: K) => Promise<R>;

// Creates a caching version of an async function. Does not cache errors.
export function cachedAsync<K extends string, R>(
  func: AsyncFunc<K, R>
): AsyncFunc<K, R> {
  const cache = new Map();
  return async (key: K) => {
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = await func(key);
    cache.set(key, result);
    return result;
  };
}
