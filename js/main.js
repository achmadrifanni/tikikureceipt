import { setupClipboard } from "./modules/clipboard.js";
import { createReceiptStore } from "./modules/receipts.js";
import { renderReceiptList } from "./modules/receipt-list.js";
import { renderPrintPreview, printReceipts } from "./modules/print.js";

const elements = {
  pasteZone: document.querySelector("#pasteZone"),
  imageInput: document.querySelector("#imageInput"),
  receiptList: document.querySelector("#receiptList"),
  receiptCount: document.querySelector("#receiptCount"),
  printPages: document.querySelector("#printPages"),
  printButton: document.querySelector("#printButton"),
  clearAllButton: document.querySelector("#clearAllButton"),
  statusMessage: document.querySelector("#statusMessage"),
};

const store = createReceiptStore();
let statusTimeout;

function showStatus(message) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.classList.add("is-visible");
  clearTimeout(statusTimeout);
  statusTimeout = setTimeout(() => elements.statusMessage.classList.remove("is-visible"), 2400);
}

function refreshUI() {
  const receipts = store.getAll();
  renderReceiptList(elements.receiptList, receipts, (id) => {
    store.remove(id);
    refreshUI();
  });
  renderPrintPreview(elements.printPages, receipts);
  elements.receiptCount.textContent = `${receipts.length} ${receipts.length === 1 ? "resi" : "resi"}`;
  elements.printButton.disabled = receipts.length === 0;
  elements.clearAllButton.disabled = receipts.length === 0;
}

async function addImageFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    showStatus("File yang dipilih harus berupa gambar.");
    return;
  }
  try {
    await store.addFile(file);
    refreshUI();
    showStatus("Screenshot berhasil ditambahkan.");
  } catch (error) {
    console.error(error);
    showStatus("Gambar tidak dapat dibaca. Coba file gambar lain.");
  }
}

setupClipboard({
  onImage: addImageFile,
  onMessage: showStatus,
  pasteZone: elements.pasteZone,
});

elements.imageInput.addEventListener("change", async (event) => {
  const files = Array.from(event.target.files ?? []);
  for (const file of files) await addImageFile(file);
  event.target.value = "";
});

elements.pasteZone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    elements.imageInput.click();
  }
});

elements.clearAllButton.addEventListener("click", () => {
  if (!store.getAll().length) return;
  store.clear();
  refreshUI();
  showStatus("Semua resi telah dihapus.");
});

elements.printButton.addEventListener("click", () => printReceipts(store.getAll()));

refreshUI();
