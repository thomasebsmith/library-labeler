class AssertionError extends Error {
  constructor(msg) {
    super(msg);
    this.name = "AssertionError";
  }
}

function assert(cond, msg) {
  if (!cond) {
    throw new AssertionError(msg);
  }
}

class AggregateError extends Error {
  constructor(errors) {
    super(errors.map(e => e.message).join("\n"));
    this.errors = errors;
  }
}

function showErrors(func) {
  try {
    func();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

function hasProp(object, propertyName) {
  return Object.prototype.hasOwnProperty.call(object, propertyName);
}
