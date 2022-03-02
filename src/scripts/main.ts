import { Config, loadConfig } from "./config";
import { SheetData, extractItems, getSheetData } from "./extractdata";
import { Avery5412, USLetter, createSheets, exportPDF } from "./sheet";
import { assert, showErrors } from "./utils";

let sheetData: SheetData | null = null;

const fileUploadEl = document.getElementById("file-upload") as HTMLInputElement;
const generateLabelsEl =
  document.getElementById("generate-labels") as HTMLButtonElement;
const generateCompanionEl =
  document.getElementById("generate-companion") as HTMLButtonElement;

function setSheetData(data: SheetData | null) {
  sheetData = data;

  [generateLabelsEl, generateCompanionEl].forEach(el => {
    el.disabled = sheetData === null;
  });
}

setSheetData(null);

fileUploadEl.addEventListener("change", () => {
  (async () => {
    setSheetData(null);
    if (fileUploadEl.files === null || fileUploadEl.files.length !== 1) {
      return;
    }

    const file = fileUploadEl.files[0];
    setSheetData(await processFile(file));

  })().catch((e: Error) => showErrors(() => { throw e; }));
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

const getConfig = (() => {
  let config: Config | null = null;
  return async function getConfig(): Promise<Config> {
    if (config === null) {
      config = await loadConfig("cok");
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
    []
  );
  exportPDF(labelSheets, "labels.pdf");
}

function exportCompanionPDF(data: SheetData) {
  const [companionSheets, _] = createSheets(
    data.map(d => d.companion), 
    USLetter.factory(),
    []
  );
  exportPDF(companionSheets, "companion.pdf");
}
