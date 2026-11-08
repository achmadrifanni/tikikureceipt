
const PAGE_HEIGHT = 297;
const PAGE_MARGIN = 10;
const COLUMN_GAP = 5;
const RECEIPT_GAP = 4;

const CONTENT_HEIGHT = PAGE_HEIGHT - PAGE_MARGIN * 2;

const COLUMN_WIDTH =
  (210 - PAGE_MARGIN * 2 - COLUMN_GAP) / 2;


// Membuat satu halaman A4 dengan dua kolom
function createPaper(pageNumber) {
  const paper = document.createElement("section");

  paper.className = "paper";
  paper.setAttribute("aria-label", `Halaman A4 ${pageNumber}`);

  paper.innerHTML = `
    <div class="paper__column"></div>
    <div class="paper__column"></div>
  `;

  return {
    element: paper,
    columns: paper.querySelectorAll(".paper__column"),
    heights: [0, 0],
    counts: [0, 0],
  };
}


// Membuat elemen gambar resi atau bukti transfer
function createReceipt(receipt) {
  const item = document.createElement("div");

  item.className = "paper__receipt";

  item.innerHTML = `
    <img
      src="${receipt.src}"
      alt="${receipt.name}"
    />
  `;

  return item;
}


// Menghitung tinggi gambar berdasarkan rasio aslinya
function getReceiptHeight(receipt) {
  return COLUMN_WIDTH * (receipt.height / receipt.width);
}


// Membatasi gambar yang terlalu tinggi agar tetap muat di satu kolom A4
function getFinalSize(receipt) {
  const naturalHeight = getReceiptHeight(receipt);

  if (naturalHeight <= CONTENT_HEIGHT) {
    return {
      height: naturalHeight,
      width: 100,
    };
  }

  const scale = CONTENT_HEIGHT / naturalHeight;

  return {
    height: CONTENT_HEIGHT,
    width: scale * 100,
  };
}


// Membuat preview halaman A4
export function renderPrintPreview(receipts, container) {
  container.innerHTML = "";

  if (receipts.length === 0) {
    container.innerHTML = `
      <div class="paper paper--empty">
        <p>Preview cetak akan muncul di sini.</p>
      </div>
    `;

    return;
  }

  let pageNumber = 1;
  let currentPage = createPaper(pageNumber);
  let currentColumn = 0;

  function nextPage() {
    container.append(currentPage.element);

    pageNumber++;
    currentPage = createPaper(pageNumber);
    currentColumn = 0;
  }

  receipts.forEach((receipt) => {
    const naturalHeight = getReceiptHeight(receipt);

    // Periksa apakah gambar muat di kolom saat ini
    let gap = currentPage.counts[currentColumn] > 0
      ? RECEIPT_GAP
      : 0;

    let remainingHeight =
      CONTENT_HEIGHT -
      currentPage.heights[currentColumn] -
      gap;

    // Jika tidak muat di kolom pertama, pindah ke kolom kedua
    if (naturalHeight > remainingHeight && currentColumn === 0) {
      currentColumn = 1;

      gap = currentPage.counts[currentColumn] > 0
        ? RECEIPT_GAP
        : 0;

      remainingHeight =
        CONTENT_HEIGHT -
        currentPage.heights[currentColumn] -
        gap;
    }

    // Jika kolom kedua juga tidak cukup, buat halaman baru
    if (naturalHeight > remainingHeight) {
      nextPage();
      gap = 0;
    }

    // Hitung ukuran akhir gambar
    const size = getFinalSize(receipt);

    const item = createReceipt(receipt);

    item.style.width = `${size.width}%`;

    currentPage.columns[currentColumn].append(item);

    // Perbarui tinggi yang sudah digunakan
    const itemGap = currentPage.counts[currentColumn] > 0
      ? RECEIPT_GAP
      : 0;

    currentPage.heights[currentColumn] +=
      size.height + itemGap;

    currentPage.counts[currentColumn]++;
  });

  // Masukkan halaman terakhir ke preview
  container.append(currentPage.element);
}
