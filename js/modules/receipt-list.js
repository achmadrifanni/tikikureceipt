export function renderReceiptList(container, receipts, onRemove) {
  container.replaceChildren();

  if (!receipts.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const title = document.createElement("strong");
    title.textContent = "Belum ada resi";
    const description = document.createElement("span");
    description.textContent = "Screenshot yang ditempel akan muncul di sini.";
    empty.append(title, description);
    container.append(empty);
    return;
  }

  receipts.forEach((receipt, index) => {
    const item = document.createElement("article");
    item.className = "receipt-item";
    item.innerHTML = `
                      <span class="receipt-item__number">
                        #${index + 1}
                      </span>

                      <div class="receipt-item__image-wrap">
                        <img
                          class="receipt-item__image"
                          src="${receipt.src}"
                          alt="Screenshot resi nomor ${index + 1}"
                          loading="lazy"
                        >
                      </div>

                      <button
                        class="receipt-item__remove"
                        type="button"
                        aria-label="Hapus resi nomor ${index + 1}"
                      >
                        ×
                      </button>
                    `;

    item.querySelector(".receipt-item__remove").addEventListener("click", () => onRemove(receipt.id));

    container.append(item);
  });
}
