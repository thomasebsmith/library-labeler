import { loadConfig } from "./config";
import { extractItems, getSheetData } from "./extractdata";
import { Avery5412, createSheets, exportPDF } from "./sheet";
import { assert, showErrors } from "./utils";

const fileUploadEl = document.getElementById("file-upload") as HTMLInputElement;
fileUploadEl.addEventListener("change", () => {
  (async () => {
    assert(fileUploadEl.files !== null, "Unexpected null files");
    assert(
      fileUploadEl.files.length === 1,
      `Expected 1 uploaded file, found ${fileUploadEl.files.length}`
    );

    const config = await loadConfig("cok");

    const file = fileUploadEl.files[0];
    const items = await extractItems(file, config);
    const data = getSheetData(items, config);

    const [labelSheets, _] = createSheets(
      data.map(d => d.label), 
      Avery5412.factory(),
      []
    );

    exportPDF(labelSheets, "temp.pdf");

  })().catch((e: Error) => showErrors(() => { throw e; }));
});
