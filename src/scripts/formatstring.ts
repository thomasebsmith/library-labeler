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

export function checkFormatString(
  string: unknown
): asserts string is FormatString {
  assert(typeof string === "string", "format must be a string");
}

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
