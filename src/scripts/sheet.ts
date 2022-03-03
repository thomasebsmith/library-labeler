import { jsPDF } from "jspdf";
import { assert } from "./utils";

export interface SheetFactory {
  create(labels: string[][]): Sheet;
  numRows: number;
  numCols: number;
}

export enum TextAlign {
  Center,
  Left,
}

export interface SheetFont {
  name: string;
  sizePt: number;
  isBold: boolean;
  lineHeightFactor: number;
  align: TextAlign;
}

export interface SheetParams {
  widthIn: number;
  heightIn: number;
  numRows: number;
  numCols: number;
  labelWidthIn: number;
  labelHeightIn: number;
  colSeparationIn: number;
  rowSeparationIn: number;
  font: SheetFont,
}

class Sheet {
  private labels: string[][];

  params: Readonly<SheetParams>;

  constructor(labels: string[][], params: SheetParams) {
    assertDimensions(labels, params.numRows, params.numCols);
    this.labels = clone(labels);
    this.params = params;
  }

  private prepare(doc: jsPDF) {
    const font = this.params.font;
    doc.setFont(font.name, "normal", font.isBold ? "bold" : "normal")
      .setFontSize(font.sizePt)
      .setLineHeightFactor(font.lineHeightFactor);
  }

  private renderLabel(
    doc: jsPDF,
    row: number,
    col: number,
    showBorder: boolean
  ) {
    assert(row >= 0 && row < this.params.numRows, "Row out-of-bounds");
    assert(col >= 0 && col < this.params.numCols, "Column out-of-bounds");

    const x = getX(this.params, row, col);
    const y = getY(this.params, row, col);

    const lines = doc.splitTextToSize(
      this.labels[row][col],
      this.params.labelWidthIn
    );
    assert(lines.length > 0, `Invalid label text "${lines.join("\n")}"`);

    const textHeight = getTextHeightIn(this.params, lines.length);
    assert(
      textHeight <= this.params.labelHeightIn,
      `Label text "${lines.join("\n")}" is too many rows`
    );

    if (showBorder) {
      // For debugging
      doc.setLineWidth(0.02).rect(
        x,
        y,
        this.params.labelWidthIn,
        this.params.labelHeightIn
      );
    }

    const textY = y + this.params.labelHeightIn / 2 - textHeight / 2;
    
    if (this.params.font.align === TextAlign.Left) {
      const textX = x;
      doc.text(lines, textX, textY, {align: "left", baseline: "top"});
    } else { // TextAlign.Center
      const textX = x + this.params.labelWidthIn / 2;
      doc.text(lines, textX, textY, {align: "center", baseline: "top"});
    }
  }

  renderLabels(doc: jsPDF, showBorder = false) {
    this.prepare(doc);
    for (let row = 0; row < this.params.numRows; ++row) {
      for (let col = 0; col < this.params.numCols; ++col) {
        this.renderLabel(doc, row, col, showBorder);
      }
    }
  }
}

export class Avery5412 extends Sheet {
  static readonly NUM_ROWS = 4;
  static readonly NUM_COLS = 5;

  constructor(labels: string[][]) {
    super(labels, {
      widthIn: 6,
      heightIn: 4,
      numRows: Avery5412.NUM_ROWS,
      numCols: Avery5412.NUM_COLS,
      labelWidthIn: 1,
      labelHeightIn: 0.75,
      colSeparationIn: 0.06,
      rowSeparationIn: 0,
      font: {
        name: "Helvetica",
        sizePt: 13,
        isBold: true,
        lineHeightFactor: 1.15,
        align: TextAlign.Center,
      },
    });
  }

  static factory(): SheetFactory {
    return {
      create: (labels) => new Avery5412(labels),
      numRows: Avery5412.NUM_ROWS,
      numCols: Avery5412.NUM_COLS,
    };
  }
}

export class USLetter extends Sheet {
  static readonly NUM_ROWS = 4;
  static readonly NUM_COLS = 5;

  constructor(labels: string[][]) {
    super(labels, {
      widthIn: 11,
      heightIn: 8.5,
      numRows: USLetter.NUM_ROWS,
      numCols: USLetter.NUM_COLS,
      labelWidthIn: 1.9,
      labelHeightIn: 1.8125,
      colSeparationIn: 0.125,
      rowSeparationIn: 1 / 12,
      font: {
        name: "Helvetica",
        sizePt: 10,
        isBold: false,
        lineHeightFactor: 1.15,
        align: TextAlign.Left,
      },
    });
  }

  static factory(): SheetFactory {
    return {
      create: (labels) => new USLetter(labels),
      numRows: USLetter.NUM_ROWS,
      numCols: USLetter.NUM_COLS,
    };
  }
}

function clone<T>(array: T[][]): T[][] {
  return array.map(subarray => subarray.slice());
}

function clonePairs<T, U>(array: [T, U][]): [T, U][] {
  return array.map(([t, u]) => [t, u]);
}

function assertDimensions<T>(array: T[][], numRows: number, numCols: number) {
  assert(
    array.length === numRows,
    `Number of rows must be ${numRows} (got ${array.length})`
  );
  for (let row = 0; row < array.length; ++row) {
    const numColsActual = array[row].length;
    assert(
      numColsActual === numCols,
      (`Number of columns must be ${numCols} (got ${numColsActual}` +
                                              ` in row ${row + 1})`)
    );
  }
}

function getXMargin(params: SheetParams): number {
  return (
    params.widthIn -
      params.labelWidthIn * params.numCols -
      params.colSeparationIn * (params.numCols - 1)
  ) / 2;
}

function getYMargin(params: SheetParams): number {
  return (
    params.heightIn -
      params.labelHeightIn * params.numRows -
      params.rowSeparationIn * (params.numRows - 1)
  ) / 2;
}

function getX(params: SheetParams, _row: number, col: number): number {
  const xMargin = getXMargin(params);
  return (params.labelWidthIn + params.colSeparationIn) * col + xMargin;
}

function getY(params: SheetParams, row: number, _col: number): number {
  const yMargin = getYMargin(params);
  return (params.labelHeightIn + params.rowSeparationIn) * row + yMargin;
}

function toInches(sizePt: number): number {
  return sizePt / 72;
}

function getLineHeightIn(params: SheetParams): number {
  return toInches(params.font.sizePt) * params.font.lineHeightFactor;
}

function getTextHeightIn(params: SheetParams, numLines: number): number {
  const lineHeight = getLineHeightIn(params);
  return lineHeight * (numLines - 1) + toInches(params.font.sizePt);
}

enum CellState {
  Free,
  Occuppied,
}

export type PartialSheet = CellState[][];

export function createSheets(
  labels: string[],
  factory: SheetFactory,
  partials: PartialSheet[]
): [Sheet[], PartialSheet[]] {
  for (const partial of partials) {
    assertDimensions(partial, factory.numRows, factory.numCols);
  }

  const everythingFree: [number, number][] = [];
  for (let row = factory.numRows - 1; row >= 0; --row) {
    for (let col = factory.numCols - 1; col >= 0; --col) {
      everythingFree.push([row, col]);
    }
  }

  if (labels.length === 0) {
    return [[], partials.slice()];
  }
  
  let currLabels: string[][] = [];
  let freeSpaces: [number, number][] = [];

  let partialIndex = 0;

  const results: Sheet[] = [];

  for (const label of labels) {
    if (freeSpaces.length === 0) {
      if (currLabels.length !== 0) {
        results.push(factory.create(currLabels));
      }
      if (partialIndex < partials.length) {
        for (let row = factory.numRows - 1; row >= 0; --row) {
          for (let col = factory.numCols - 1; col >= 0; --col) {
            if (partials[partialIndex][row][col] === CellState.Free) {
              freeSpaces.push([row, col]);
            }
          }
        }
        ++partialIndex;
      } else {
        freeSpaces = clonePairs(everythingFree);
      }
      currLabels = new Array(factory.numRows)
        .fill(null)
        .map(() => new Array(factory.numCols).fill(""));
    }

    const next = freeSpaces.pop() as [number, number];
    currLabels[next[0]][next[1]] = label;
  }

  results.push(factory.create(currLabels));
  if (freeSpaces.length === 0) {
    return [results, partials.slice(partialIndex)];
  } else {
    const partialToAdd: PartialSheet = new Array(factory.numRows)
      .fill(null)
      .map(() => new Array(factory.numCols).fill(CellState.Occuppied));
    for (const [row, col] of freeSpaces) {
      partialToAdd[row][col] = CellState.Free;
    }
    return [results, [partialToAdd].concat(partials.slice(partialIndex))];
  }
}

export function exportPDF(
  sheets: Sheet[],
  fileName: string,
  showBorder = false
) {
  assert(sheets.length > 0, "Cannot create empty sheets array");

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "in",
    format: [sheets[0].params.widthIn, sheets[0].params.heightIn],
  });

  for (let i = 0; i < sheets.length; ++i) {
    const sheet = sheets[i];
    if (i !== 0) {
      // The first page is added by jsPDF. All others need to be added
      // explicitly.
      doc.addPage([sheet.params.widthIn, sheet.params.heightIn]);
    }
    sheet.renderLabels(doc, showBorder);
  }

  doc.save(fileName);
}
