import { parse as papaParse, ParseError, ParseLocalConfig } from "papaparse";
import { Config, ImportFormat, loadImportFormat } from "./config";
import {
  FormatEnvironment,
  FormatSet,
  format,
  applyFormatConfig,
  deriveFormats,
} from "./formatstring";
import { assert, cachedAsync, hasProp } from "./utils";

const BEGIN_ARTICLES_REGEX = /^[^a-z0-9]*(a|an|the)\s+/i;
const NON_ALPHANUM_REGEX = /[^a-zA-Z0-9]/g;

// Abbreviates a name based on config. If isWords and
// config.abbreviation.remove_articles are true, removes articles from the
// beginning of name.
// Uses max_name_characters and remove_articles from config.abbreviation.
function abbrevName(name: string, isWords: boolean, config: Config): string {
  if (isWords && config.abbreviation.remove_articles) {
    name = name.replace(BEGIN_ARTICLES_REGEX, "");
  }
  return name.replace(NON_ALPHANUM_REGEX, "")
    .substring(0, config.abbreviation.max_name_characters);
}

// Abbreviates a string representation of a number based on config.
// Uses abbreviation.max_decimal_places from config.
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

// Modified values created based on imported information.
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

// Creates an error message from a PapaParse error.
function getErrorMessage(error: ParseError): string {
  if (hasProp(error, "index")) {
    return `${error.message} (row ${error.row}, index ${error.index})`;
  } else {
    return `${error.message} (row ${error.row})`;
  }
}

// Asynchronously parses all rows in file based on format.
// The return value is an array of (column name) -> (column value) mappings.
function parseDelimitedFile(
  file: File,
  format: ImportFormat
): Promise<FormatEnvironment[]> {
  return new Promise((
    resolve: (envs: FormatEnvironment[]) => void,
    reject: (error: Error) => void
  ) => {
    const config: ParseLocalConfig<FormatEnvironment, File> = {
      delimiter: format.parse.delimiter,
      header: true,
      skipEmptyLines: format.parse.skip_empty_lines ?? true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new AggregateError(
            results.errors,
            results.errors.map(getErrorMessage).join("\n")
          ));
        } else {
          resolve(results.data);
        }
      }
    };
    if (format.parse.quote_char !== undefined) {
      config.quoteChar = format.parse.quote_char;
    }
    papaParse<FormatEnvironment>(file, config);
  });
}

const loadCachedImportFormat = cachedAsync(loadImportFormat);

// Asynchronously extracts standard information (title, author, etc.) from file
// based on config.
export async function extractItems(
  file: File,
  config: Config
): Promise<FormatEnvironment[]> {
  const format = await loadCachedImportFormat(config.import_format);

  const items = await parseDelimitedFile(file, format);

  return items.map(item =>
    deriveFormats(
      deriveFormats(item, format.extract, config),
      DERIVED_FORMAT,
      config
    )
  );
}

// An array of cells for both the label and companion sheets.
export type SheetData = { label: string; companion: string }[];

// Creates label/companion information based on config and the standard
// information in items.
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
