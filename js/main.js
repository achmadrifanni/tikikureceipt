import { setupClipboard } from "./modules/clipboard.js";
import { createReceiptStore } from "./modules/receipts.js";
import { renderReceiptList } from "./modules/receipt-list.js";
import { renderPrintPreview, printReceipts } from "./modules/print.js";
import { readBoronganPdf } from "./modules/pdf-summary.js";
import { renderBoronganSummary, convertSummaryToImage } from "./modules/pdf-summary-view.js";
import { showRestorePrompt } from "./modules/restore-prompt.js";

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
  previewViewport: document.querySelector("#previewViewport"),
  previewCanvas: document.querySelector("#previewCanvas"),
  zoomIn: document.querySelector("#zoomIn"),
  zoomOut: document.querySelector("#zoomOut"),
  zoomReset: document.querySelector("#zoomReset"),
  zoomLevel: document.querySelector("#zoomLevel"),
};

const store = createReceiptStore();
let statusTimeout;

function showStatus(message) {
  elements.statusMessage.textContent = message;
  elements.statusMessage.classList.add("is-visible");
  clearTimeout(statusTimeout);
  statusTimeout = setTimeout(() => elements.statusMessage.classList.remove("is-visible"), 2400);
}

// Pengaturan zoom preview A4
let zoomScale = 1;

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

function updateZoom(newScale, resetPosition = false) {
  const viewport = elements.previewViewport;
  const canvas = elements.previewCanvas;

  // Simpan titik tengah viewport sebelum zoom berubah
  // const centerX = (viewport.scrollLeft + viewport.clientWidth / 2) / zoomScale;

  // const centerY = (viewport.scrollTop + viewport.clientHeight / 2) / zoomScale;

  if (resetPosition) {
    viewport.scrollTo({
      left: 0,
      top: 0,
    });
  } else {
    viewport.scrollTo({
      left: 0,
      top: 0,
    });
  }

  // Batasi zoom antara 50% dan 200%
  zoomScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newScale));

  // Terapkan zoom pada canvas
  canvas.style.transform = `scale(${zoomScale})`;

  // Perbarui tulisan persentase
  elements.zoomLevel.textContent = `${Math.round(zoomScale * 100)}%`;

  // Atur posisi scroll agar titik tengah tetap terjaga
  if (resetPosition) {
    viewport.scrollTo({
      left: 0,
      top: 0,
    });
  } else {
    viewport.scrollLeft = centerX * zoomScale - viewport.clientWidth / 2;

    viewport.scrollTop = centerY * zoomScale - viewport.clientHeight / 2;
  }

  // Nonaktifkan tombol jika mencapai batas zoom
  elements.zoomIn.disabled = zoomScale >= MAX_ZOOM;
  elements.zoomOut.disabled = zoomScale <= MIN_ZOOM;
}

// Tombol Zoom In
elements.zoomIn.addEventListener("click", () => {
  updateZoom(zoomScale + ZOOM_STEP);
});

// Tombol Zoom Out
elements.zoomOut.addEventListener("click", () => {
  updateZoom(zoomScale - ZOOM_STEP);
});

// Tombol Reset
elements.zoomReset.addEventListener("click", () => {
  updateZoom(1, true);
});

// Inisialisasi zoom
updateZoom(1, true);

async function checkRecovery() {
  try {
    const snapshot = await store.getRecoverySnapshot();

    // Tidak ada backup, tidak perlu menampilkan modal
    if (!snapshot) return;

    // Tampilkan modal pemulihan
    showRestorePrompt({
      onRestore: async () => {
        await store.restore(snapshot);

        showStatus("Pekerjaan sebelumnya berhasil dipulihkan.");
        refreshUI();
      },

      onStartNew: async () => {
        await store.discardRecovery();

        showStatus("Memulai pekerjaan baru.");
        refreshUI();
      },
    });
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
