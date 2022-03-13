import {
  FormatConfig,
  FormatSet,
  FormatString,
  checkFormatConfig,
  checkFormatString,
  checkFormatSet,
} from "./formatstring";
import { assert, hasProp } from "./utils";

interface ImportFormats {
  "LibraryThing": FormatSet<Config>;
}

export const IMPORT_FORMATS: ImportFormats = {
  "LibraryThing": {
    "title": "{Title}",
    "author": "{Primary Author}",
    "categories": "{Collections}",
    "dewey": "{Dewey Decimal}",
    "call_number": "{Other Call Number}"
  }
};

export type ImportFormatName = keyof ImportFormats;

interface Categories {
  [name: string]: {
    format: FormatString;
    data?: FormatSet<Config>;
  };
}

interface Formats {
  [name: string]: {
    label: FormatConfig;
    companion: FormatConfig;
    sort: FormatString;
  };
}

interface Abbreviation {
  remove_articles: boolean;
  max_decimal_places: number;
  max_name_characters: number;
}

export interface Config {
  name: string;
  categories: Categories;
  formats: Formats;
  abbreviation: Abbreviation;
  import_format: ImportFormatName;
}

function checkCategories(
  categories: unknown
): asserts categories is Categories {
  assert(
    typeof categories === "object" && categories !== null,
    "categories must be an object"
  );

  for (const category of Object.values(categories)) {
    assert(
      typeof category === "object" && category !== null,
      "category must be an object"
    );

    assert(hasProp(category, "format"), "format is required");
    checkFormatString(category.format);

    if (hasProp(category, "data")) {
      checkFormatSet(category.data);
    }
  }
}

function checkFormats(formats: unknown): asserts formats is Formats {
  assert(
    typeof formats === "object" && formats !== null,
    "formats must be an object"
  );

  for (const format of Object.values(formats)) {
    assert(hasProp(format, "label"), "label is required");
    checkFormatConfig(format.label);
    assert(hasProp(format, "companion"), "companion is required");
    checkFormatConfig(format.companion);
    assert(hasProp(format, "sort"), "sort is required");
    checkFormatString(format.sort);
  }
}

function checkAbbreviation(abbrev: unknown): asserts abbrev is Abbreviation {
  assert(
    typeof abbrev === "object" && abbrev !== null,
    "abbreviation must be an object"
  );

  assert(hasProp(abbrev, "remove_articles"), "remove_articles is required");
  assert(
    typeof abbrev.remove_articles === "boolean",
    "remove_articles must be a boolean"
  );

  assert(
    hasProp(abbrev, "max_decimal_places"),
    "max_decimal_places is required"
  );
  assert(
    typeof abbrev.max_decimal_places === "number",
    "max_decimal_places must be a number"
  );

  assert(
    hasProp(abbrev, "max_name_characters"),
    "max_name_characters is required"
  );
  assert(
    typeof abbrev.max_name_characters === "number",
    "max_name_characters must be a number"
  );
}

function checkConfig(config: unknown): asserts config is Config {
  assert(
    typeof config === "object" && config !== null,
    "config must be an object"
  );

  assert(hasProp(config, "name"), "name is required");
  assert(typeof config.name === "string", "name must be a string");

  assert(hasProp(config, "categories"), "categories is required");
  checkCategories(config.categories);

  assert(hasProp(config, "formats"), "formats is required");
  checkFormats(config.formats);

  assert(hasProp(config, "abbreviation"), "abbreviation is required");
  checkAbbreviation(config.abbreviation);

  assert(hasProp(config, "import_format"), "import_format is required");
  assert(
    typeof config.import_format === "string",
    "import_format must be a string"
  );
  assert(
    hasProp(IMPORT_FORMATS, config.import_format),
    "Invalid import_format"
  );
}

const CONFIG_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export async function loadConfig(configName: string): Promise<Config> {
  assert(
    CONFIG_NAME_REGEX.test(configName),
    "Config name contains invalid characters"
  );

  const response = await fetch(`./config/${configName}.json`);
  assert(response.ok, `Could not fetch config "${configName}"`);

  const config = await response.json();
  checkConfig(config);
  return config;
}
