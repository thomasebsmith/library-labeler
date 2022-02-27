const fileUploadEl = document.getElementById("file-upload");
fileUploadEl.addEventListener("change", () => {
  showErrors(() => {
    assert(
      fileUploadEl.files.length === 1,
      `Expected 1 uploaded file, found ${fileUploadEl.files.length}`
    );

    const file = fileUploadEl.files[0];
    extractItems(file, CONFIG).then(items => {
      const data = getSheetData(items, CONFIG);

      const labels = new Array(4).fill().map(
        (_, r) => new Array(5).fill().map(
          (_, c) => ((r * 5 + c) >= data.length) ? "" : data[r * 5 + c].label
        )
      );
      exportPDF(labels, "temp.pdf");
    }).catch(e => showErrors(() => { throw e; }));
  });
});
