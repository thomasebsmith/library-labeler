import { parse as papaParse } from "papaparse";
import { Config, IMPORT_FORMATS } from "./config";
import {
  FormatEnvironment,
  FormatSet,
  format,
  applyFormatConfig,
  deriveFormats,
} from "./formatstring";
import { assert, hasProp } from "./utils";

const BEGIN_ARTICLES_REGEX = /^[^a-z0-9]*(a|an|the)\s+/i;
const NON_ALPHANUM_REGEX = /[^a-zA-Z0-9]/g;

function abbrevName(name: string, isWords: boolean, config: Config): string {
  if (isWords && config.abbreviation.remove_articles) {
    name = name.replace(BEGIN_ARTICLES_REGEX, "");
  }
  return name.replace(NON_ALPHANUM_REGEX, "")
    .substring(0, config.abbreviation.max_name_characters);
}

function abbrevDecimal(decimal: string, config: Config): string {
  const parts = decimal.split(".");
  if (parts.length < 2) {
    return decimal;
  }

  assert(parts.length === 2, `Invalid decimal "${decimal}"`);
  const [integer, fraction] = parts;
  const abbrevFraction = fraction.substring(
    0,
    config.abbreviation.max_decimal_places
  );
  return `${integer}.${abbrevFraction}`;
}

const DERIVED_FORMAT: FormatSet<Config> = {
  "title_abbrev": ({title}, config) => abbrevName(title, true, config),
  "author_abbrev": ({author}, config) => abbrevName(author, false, config),
  "dewey_abbrev": ({dewey}, config) => abbrevDecimal(dewey, config),
  "category": (environment, config) => {
    const filteredCategories = environment.categories.split(/,\s*/g)
      .filter(category => hasProp(config.categories, category));
    assert(
      filteredCategories.length > 0,
      `No valid category for item "${environment.title}"`
    );
    assert(
      filteredCategories.length === 1,
      `Too many categories for item "${environment.title}"`
    );
    return filteredCategories[0];
  }
};

function parseTSV(file: File): Promise<FormatEnvironment[]> {
  return new Promise((
    resolve: (envs: FormatEnvironment[]) => void,
    reject: (error: Error) => void
  ) => {
    papaParse<FormatEnvironment>(file, {
      delimiter: "\t",
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new AggregateError(results.errors));
        } else {
          resolve(results.data);
        }
      }
    });
  });
}

export async function extractItems(
  file: File,
  config: Config
): Promise<FormatEnvironment[]> {
  const items = await parseTSV(file);
  assert(
    hasProp(IMPORT_FORMATS, config.import_format),
    `Invalid import_format "${config.import_format}"`
  );

  const importFormat = IMPORT_FORMATS[config.import_format];

  return items.map(item =>
    deriveFormats(
      deriveFormats(item, importFormat, config),
      DERIVED_FORMAT,
      config
    )
  );
}

export type SheetData = { label: string; companion: string }[];

export function getSheetData(
  items: FormatEnvironment[],
  config: Config
): SheetData {
  const data = items.map(item => {
    // This should be guaranteed from initial category filtering
    assert(
      hasProp(config.categories, item.category),
      "Internal error: Invalid category"
    );

    const category = config.categories[item.category];

    if (typeof category.data !== "undefined") {
      item = deriveFormats(item, category.data, config);
    }

    const formatName = category.format;
    assert(
      hasProp(config.formats, formatName),
      `Invalid format "${formatName}"`
    );
    const formatConfig = config.formats[formatName];

    const label = applyFormatConfig(formatConfig.label, item);
    const companion = applyFormatConfig(formatConfig.companion, item);
    const sort = format(formatConfig.sort, item);

    return {
      label,
      companion,
      sort
    };
  });

  data.sort(({sort: sort1}, {sort: sort2}) => {
    if (sort1 === sort2) {
      return 0;
    }
    if (sort1 < sort2) {
      return -1;
    }
    return 1;
  });

  // Don't return the sort key
  return data.map(({label, companion}) => ({label, companion}));
}