import { assert, hasProp } from "./utils";

export type FormatString = string;

export interface FormatConfig {
  format: FormatString;
  trim?: boolean;
}

export type FormatFunction<T> = (
  environment: FormatEnvironment,
  metadata: T,
  propertyName: string
) => string;

export interface FormatSet<T> {
  [key: string]: FormatString | FormatFunction<T>;
}

export interface FormatEnvironment {
  [key: string]: string;
}

const ESCAPED_REGEX = /\\([\s\S])/g;
const FORMAT_REGEX = /\{(([^}]|\\\})*)\}/g;

function unescapeBackslashes(string: string): string {
  return string.replace(ESCAPED_REGEX, "$1");
}

// Fill in a format string based on a given environment.
// Each {name} is replaced with environment[name].
// Curly braces *within a name* can be escaped using a preceding backslash.
export function format(
  string: string,
  environment: FormatEnvironment
): string {
  return string.replace(FORMAT_REGEX, (_, escapedMatch) => {
    const match = unescapeBackslashes(escapedMatch);
    assert(
      hasProp(environment, match),
      `"${match}" was not specified for format string "${string}"`
    );
    return environment[match];
  });
}

// Fills in a format string with additional config.
// See format(...) documentation for format string syntax.
export function applyFormatConfig(
  config: FormatConfig,
  environment: FormatEnvironment
): string {
  let text = format(config.format, environment);
  if (hasProp(config, "trim") && config.trim) {
    text = text.trim();
  }
  return text;
}

// Creates a new format environment (key-value mapping) based on derivedFormats.
// Each key in derivedFormats should map to either a format string (which will
// be filled in based on environment) or a function (which will be passed
// environment, metadata, and the key).
export function deriveFormats<T>(
  environment: FormatEnvironment,
  derivedFormats: FormatSet<T>,
  metadata: T
): FormatEnvironment {
  const addedEnvironment = Object.fromEntries(
    Object.entries(derivedFormats)
      .map(([name, theFormat]) => {
        if (typeof theFormat === "function") {
          return [name, theFormat(environment, metadata, name)];
        } else {
          assert(typeof theFormat === "string", "Invalid format type");
          return [name, format(theFormat, environment)];
        }
      })
  );

  const newEnvironment = Object.assign({}, environment);
  return Object.assign(newEnvironment, addedEnvironment);
}

// Checks that string is a valid format string. Currently this does not check
// the curly brace syntax at all.
export function checkFormatString(
  string: unknown
): asserts string is FormatString {
  assert(typeof string === "string", "format must be a string");
}

// Checks that config is a valid FormatConfig.
export function checkFormatConfig(
  config: unknown
): asserts config is FormatConfig {
  assert(
    typeof config === "object" && config !== null,
    "config must be an object"
  );
  assert(hasProp(config, "format"), "format is required");
  checkFormatString(config.format);

  if (hasProp(config, "trim")) {
    assert(typeof config.trim === "boolean", "trim must be a boolean");
  }
}

// Checks that set is a valid FormatSet<T>.
export function checkFormatSet<T>(set: unknown): asserts set is FormatSet<T> {
  // NB: This does not allow function format sets.
  assert(
    typeof set === "object" && set !== null,
    "format set must be an object"
  );
  for (const formatString of Object.values(set)) {
    checkFormatString(formatString);
  }
}
