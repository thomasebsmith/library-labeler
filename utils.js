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

function showErrors(func) {
  try {
    func();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}
