import { Config, loadConfig } from "./config";
import { SheetData, extractItems, getSheetData } from "./extractdata";
import {
  Avery5412,
  CellState,
  PartialSheet,
  USLetter,
  createSheets,
  exportPDF
} from "./sheet";
import { assert, showError, showErrors } from "./utils";

let sheetData: SheetData | null = null;

const fileUploadEl = document.getElementById("file-upload") as HTMLInputElement;
const generateLabelsEl =
  document.getElementById("generate-labels") as HTMLButtonElement;
const generateCompanionEl =
  document.getElementById("generate-companion") as HTMLButtonElement;
const addPartialSheetEl =
  document.getElementById("add-partial-sheet") as HTMLButtonElement;
const partialSheetsEl =
  document.getElementById("partial-sheets") as HTMLDivElement;

function setSheetData(data: SheetData | null) {
  sheetData = data;

  [generateLabelsEl, generateCompanionEl].forEach(el => {
    el.disabled = sheetData === null;
  });
}

setSheetData(null);

fileUploadEl.value = "";
fileUploadEl.addEventListener("change", () => {
  (async () => {
    setSheetData(null);
    if (fileUploadEl.files === null || fileUploadEl.files.length !== 1) {
      return;
    }

    const file = fileUploadEl.files[0];
    setSheetData(await processFile(file));

  })().catch(showError);
});

generateLabelsEl.addEventListener("click", () => {
  showErrors(() => {
    assert(sheetData !== null, "You shouldn't be able to click this!");
    exportLabelsPDF(sheetData);
  });
});

generateCompanionEl.addEventListener("click", () => {
  showErrors(() => {
    assert(sheetData !== null, "You shouldn't be able to click this!");
    exportCompanionPDF(sheetData);
  });
});

addPartialSheetEl.addEventListener("click", () => addPartialSheet());

function addPartialSheet(newSheet = unusedSheet()) {
  const partialEl = document.createElement("div");
  partialEl.classList.add("partial");
  for (const row of newSheet) {
    const rowEl = document.createElement("div");
    for (const state of row) {
      const checkboxEl = document.createElement("input");
      checkboxEl.type = "checkbox";
      checkboxEl.checked = state == CellState.Occuppied;
      rowEl.appendChild(checkboxEl);
    }
    partialEl.appendChild(rowEl);
  }
  partialSheetsEl.appendChild(partialEl);
}

function unusedSheet(): PartialSheet {
  return new Array(Avery5412.NUM_ROWS)
    .fill(null)
    .map(() => new Array(Avery5412.NUM_COLS).fill(CellState.Free));
}

function getPartialSheets(): PartialSheet[] {
  const partials: PartialSheet[] = [];
  for (const partialEl of Array.from(partialSheetsEl.children)) {
    const partial = unusedSheet();
    for (let row = 0; row < partialEl.children.length; ++row) {
      const rowEl = partialEl.children[row];
      for (let col = 0; col < rowEl.children.length; ++col) {
        const colEl = rowEl.children[col] as HTMLInputElement;
        if (colEl.checked) {
          partial[row][col] = CellState.Occuppied;
        }
      }
    }
    partials.push(partial);
  }
  return partials;
}

function getConfigName(): string {
  return "cok";
}

const getConfig = (() => {
  let config: Config | null = null;
  return async function getConfig(): Promise<Config> {
    if (config === null) {
      config = await loadConfig(getConfigName());
    }
    return config;
  };
})();

async function processFile(file: File): Promise<SheetData> {
  const config = await getConfig();
  const items = await extractItems(file, config);
  return getSheetData(items, config);
}

function exportLabelsPDF(data: SheetData) {
  const [labelSheets, _] = createSheets(
    data.map(d => d.label), 
    Avery5412.factory(),
    getPartialSheets()
  );
  exportPDF(labelSheets, "labels.pdf");
}

function exportCompanionPDF(data: SheetData) {
  const [companionSheets, _] = createSheets(
    data.map(d => d.companion), 
    USLetter.factory(),
    getPartialSheets()
  );
  exportPDF(companionSheets, "companion.pdf");
}
