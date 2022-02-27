import { loadConfig } from "./config";
import { extractItems, getSheetData } from "./extractdata";
import { exportPDF } from "./createlabels";
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

    const labels = new Array(4).fill(null).map(
      (_, r) => new Array(5).fill(null).map(
        (_, c) => ((r * 5 + c) >= data.length) ? "" : data[r * 5 + c].label
      )
    );

    exportPDF(labels, "temp.pdf");

  })().catch((e: Error) => showErrors(() => { throw e; }));
});
