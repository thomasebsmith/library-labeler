(() => {
  const IMPORT_FORMATS = {
    "LibraryThing": {
      "title": "{Title}",
      "author": "{Primary Author}",
      "categories": "{Collections}",
      "dewey": "{Dewey Decimal}",
      "call_number": "{Other Call Number}"
    }
  };

  const BEGIN_ARTICLES_REGEX = /^[^a-z0-9]*(a|an|the)\s+/i;
  const NON_ALPHANUM_REGEX = /[^a-zA-Z0-9]/g;

  function abbrevName(name, isWords, {abbreviation: config}) {
    if (isWords && config.remove_articles) {
      name = name.replace(BEGIN_ARTICLES_REGEX, "");
    }
    return name.replace(NON_ALPHANUM_REGEX, "")
      .substring(0, config.max_name_characters);
  }

  function abbrevDecimal(decimal, {abbreviation: config}) {
    const parts = decimal.split(".");
    if (parts.length < 2) {
      return;
    }

    assert(parts.length === 2, `Invalid decimal "${decimal}"`);
    const [integer, fraction] = parts;
    return `${integer}.${fraction.substring(0, config.max_decimal_places)}`;
  }

  const DERIVED_FORMAT = {
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

  function parseTSV(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
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

  async function extractItems(file, config) {
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

  function getSheetData(items, config) {
    const data = items.map(item => {
      // This should be guaranteed from initial category filtering
      assert(
        hasProp(config.categories, item.category),
        "Internal error: Invalid category"
      );

      const category = config.categories[item.category];

      if (hasProp(category, "data")) {
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

  window.extractItems = extractItems;
  window.getSheetData = getSheetData;
})();
