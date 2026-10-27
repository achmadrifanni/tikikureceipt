const PAGE_CAPACITY = 8; // Starter default: 4 receipt slots per column. Tune after testing real screenshots.

function createPaper(receipts, pageNumber) {
  const paper = document.createElement("section");
  paper.className = "paper";
  paper.setAttribute("aria-label", `Halaman A4 ${pageNumber}`);

  paper.innerHTML = `
                      ${receipts
                        .map(
                          (receipt) => `
                                        <div class="paper__receipt">
                                          <img
                                            src="${receipt.src}"
                                            alt="Resi untuk dicetak"
                                            draggable="false"
                                          >
                                        </div>
                                      `,
                        )
                        .join("")}
                    `;

  return paper;
}

export function renderPrintPreview(container, receipts) {
  container.replaceChildren();

  if (!receipts.length) {
    const emptyPaper = document.createElement("div");
    emptyPaper.className = "paper paper--empty";

    emptyPaper.innerHTML = `
                            <p>Preview cetak akan muncul di sini.</p>
                          `;
    container.append(emptyPaper);
    return;
  }

  // Simple starter behavior: split receipts into pages by a fixed count.
  // Later, improve this to measure each image's rendered height and flow to the next page automatically.
  for (let start = 0, page = 1; start < receipts.length; start += PAGE_CAPACITY, page += 1) {
    const pageReceipts = receipts.slice(start, start + PAGE_CAPACITY);
    container.append(createPaper(pageReceipts, page));
  }
}

export function printReceipts(receipts) {
  if (!receipts.length) return;
  // Uses the browser's print dialog and CSS @media print rules.
  window.print();
}
