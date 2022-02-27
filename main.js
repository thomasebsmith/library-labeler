document.querySelector("button").addEventListener("click", () => {
  showErrors(() => {
    const labels = new Array(4).fill().map(
      (_, r) => new Array(5).fill().map(
        (_, c) => new Array(((Math.random() * 3) | 0) + 1).fill().map(
          (_, l) => `R${r + 1} C${c + 1} L${l + 1}`
        ).join("\n")
      )
    );
    window.exportPDF(labels, "temp.pdf");
  });
});
