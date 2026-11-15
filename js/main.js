import { setupClipboard } from "./modules/clipboard.js";
import { createReceiptStore } from "./modules/receipts.js";
import { renderReceiptList } from "./modules/receipt-list.js";
import { renderPrintPreview, printReceipts } from "./modules/print.js";
import { readBoronganPdf } from "./modules/pdf-summary.js";
import { renderBoronganSummary, convertSummaryToImage } from "./modules/pdf-summary-view.js";

const elements = {
  pasteZone: document.querySelector("#pasteZone"),
  imageInput: document.querySelector("#imageInput"),
  pdfInput: document.querySelector("#pdfInput"),
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

async function checkRecovery() {
  console.log("CHECK RECOVERY DIJALANKAN");

  try {
    const snapshot = await store.getRecoverySnapshot();

    if (!snapshot) return;

    const savedDate = new Date(snapshot.savedAt).toLocaleString("id-ID");

    const shouldRestore = window.confirm(
      `PEKERJAAN SEBELUMNYA DITEMUKAN!\n\n` +
        `Jumlah gambar: ${snapshot.receipts.length}\n` +
        `Terakhir disimpan: ${savedDate}\n\n` +
        `Apakah kamu ingin memulihkan pekerjaan sebelumnya?`,
    );

    if (shouldRestore) {
      await store.restore(snapshot);
      showStatus("Pekerjaan sebelumnya berhasil dipulihkan.");
    } else {
      await store.discardRecovery();
      showStatus("Backup sebelumnya diabaikan.");
    }
  } catch (error) {
    console.error(error);
    showStatus("Gagal memeriksa backup sebelumnya.");
  }
}

function refreshUI() {
  const receipts = store.getAll();
  renderReceiptList(elements.receiptList, receipts, async (id) => {
    try {
      await store.remove(id);
      refreshUI();
    } catch (error) {
      console.error(error);
      showStatus("Gagal menyimpan perubahan.");
    }
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

elements.clearAllButton.addEventListener("click", async () => {
  if (!store.getAll().length) return;

  try {
    await store.clear();
    refreshUI();
    showStatus("Semua resi telah dihapus.");
  } catch (error) {
    console.error(error);
    showStatus("Gagal menghapus data.");
  }
});

elements.printButton.addEventListener("click", () => printReceipts(store.getAll()));

async function initializeApp() {
  await checkRecovery();
  refreshUI();
}

initializeApp();

elements.pdfInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];

  if (!file) return;

  try {
    // 1. Membaca dan mengambil data PDF
    const data = await readBoronganPdf(file);

    // 2. Membuat tampilan HTML ringkasan
    const summaryPreview = document.querySelector("#pdfSummaryPreview");

    renderBoronganSummary(data, summaryPreview);

    summaryPreview.hidden = false;

    // 3. Mengubah HTML menjadi gambar PNG
    const imageData = await convertSummaryToImage(summaryPreview);

    // 4. Memasukkan gambar ke daftar resi
    await store.addImageData(imageData);

    // 5. Menyembunyikan preview HTML sementara
    summaryPreview.hidden = true;

    // 6. Memperbarui daftar resi dan preview A4
    refreshUI();

    showStatus("Ringkasan PDF berhasil ditambahkan.");

    console.log("Gambar ringkasan berhasil ditambahkan:", imageData);
  } catch (error) {
    console.error(error);
    showStatus(error.message || "PDF gagal diproses.");
  } finally {
    event.target.value = "";
  }
});
