(() => {
  const ESCAPED_REGEX = /\\([\s\S])/g;
  const FORMAT_REGEX = /\{(([^\}]|\\\})*)\}/g;

  function unescapeBackslashes(string) {
    return string.replace(ESCAPED_REGEX, "$1");
  }

  function format(string, environment) {
    return string.replace(FORMAT_REGEX, (_, escapedMatch) => {
      const match = unescapeBackslashes(escapedMatch);
      assert(
        hasProp(environment, match),
        `"${match}" was not specified for format string "${string}"`
      );
      return environment[match];
    });
  }

  function applyFormatConfig(config, environment) {
    let text = format(config.format, environment);
    if (hasProp(config, "trim") && config.trim) {
      text = text.trim();
    }
    return text;
  }

  function deriveFormats(environment, derivedFormats, metadata) {
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

  window.format = format;
  window.applyFormatConfig = applyFormatConfig;
  window.deriveFormats = deriveFormats;
})();
