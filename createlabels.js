(() => {
  const { jsPDF } = window.jspdf;

  // Avery 5412 specs
  const SHEET_WIDTH = 6;
  const SHEET_HEIGHT = 4;
  const NUM_COLS = 5;
  const NUM_ROWS = 4;
  const LABEL_WIDTH = 1;
  const LABEL_HEIGHT = 0.75;
  const COL_SEPARATION = 0.06;

  const POINT_SIZE = 1 / 72;

  const LINE_HEIGHT_FACTOR = 1.15;
  const FONT_SIZE_PT = 13;
  const FONT_SIZE_IN = FONT_SIZE_PT * POINT_SIZE;
  const LINE_HEIGHT_IN = FONT_SIZE_IN * LINE_HEIGHT_FACTOR;

  const X_MARGIN = (
    SHEET_WIDTH - (LABEL_WIDTH + COL_SEPARATION) * NUM_COLS
  ) / 2;
  const Y_MARGIN = (SHEET_HEIGHT - LABEL_HEIGHT * NUM_ROWS) / 2;

  function prepareForLabels(doc) {
    doc.setFont("Helvetica", "normal", "bold")
      .setFontSize(FONT_SIZE_PT)
      .setLineHeightFactor(LINE_HEIGHT_FACTOR);
  }

  function addLabel(doc, row, col, text, showBorder) {
    assert(row >= 0 && row < NUM_ROWS, "Row out-of-bounds");
    assert(col >= 0 && col < NUM_COLS, "Column out-of-bounds");

    const x = (LABEL_WIDTH + COL_SEPARATION) * col + X_MARGIN;
    const y = LABEL_HEIGHT * row + Y_MARGIN;

    const lines = text.split("\n");
    assert(lines.length > 0, `Invalid label text "${text}"`);

    const textHeight = (lines.length - 1) * LINE_HEIGHT_IN + FONT_SIZE_IN;
    assert(textHeight <= LABEL_HEIGHT, `Label text "${text}" is too many rows`);

    if (showBorder) {
      // For debugging
      doc.setLineWidth(0.02).rect(x, y, LABEL_WIDTH, LABEL_HEIGHT);
    }

    const textX = x + LABEL_WIDTH / 2;
    const textY = y + LABEL_HEIGHT / 2 - textHeight / 2;
    
    doc.text(lines, textX, textY, {align: "center", baseline: "top"});
  }

  window.exportPDF = (labels, fileName, showBorder = false) => {
    // Check that labels is a 2D array of the appropriate dimensions
    assert(
      labels.length === NUM_ROWS,
      `Expected ${NUM_ROWS} rows but found ${labels.length}`
    );
    for (let row = 0; row < labels.length; ++row) {
      assert(
        labels[row].length === NUM_COLS,
        (`Expected ${NUM_COLS} columns but found` +
          ` ${labels[row].length} in row ${row + 1}`)
      );
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "in",
      format: [SHEET_WIDTH, SHEET_HEIGHT],
    });

    prepareForLabels(doc);

    for (let row = 0; row < labels.length; ++row) {
      for (let col = 0; col < labels[row].length; ++col) {
        const text = labels[row][col];
        addLabel(doc, row, col, text, showBorder);
      }
    }

    doc.save(fileName);
  };
})();
