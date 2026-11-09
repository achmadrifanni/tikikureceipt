import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";

// ======================================
// 1. MEMBACA TEKS PDF
// ======================================

export async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: arrayBuffer,
  }).promise;

  const allLines = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();

    const rows = [];

    textContent.items.forEach((item) => {
      if (!item.str.trim()) return;

      const x = item.transform[4];
      const y = item.transform[5];

      // Cari baris yang memiliki posisi Y berdekatan
      let row = rows.find((existingRow) => Math.abs(existingRow.y - y) < 2);

      if (!row) {
        row = {
          y,
          items: [],
        };

        rows.push(row);
      }

      row.items.push({
        x,
        text: item.str,
      });
    });

    // Urutkan baris dari atas ke bawah
    rows.sort((a, b) => b.y - a.y);

    rows.forEach((row) => {
      // Urutkan teks dalam baris dari kiri ke kanan
      row.items.sort((a, b) => a.x - b.x);

      const line = row.items
        .map((item) => item.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      allLines.push(line);
    });
  }

  return allLines.join("\n");
}

// ======================================
// 2. MENGUBAH NOMINAL MENJADI ANGKA
// ======================================

function parseMoney(value) {
  if (!value) return null;

  return Number(value.replace(/[^\d]/g, ""));
}

function formatReportDate(value) {
  if (!value) return "";

  const monthNames = {
    januari: "01",
    februari: "02",
    maret: "03",
    april: "04",
    mei: "05",
    juni: "06",
    juli: "07",
    agustus: "08",
    september: "09",
    oktober: "10",
    november: "11",
    desember: "12",
  };

  const match = value.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/i);

  if (!match) return value;

  const [, day, month, year] = match;
  const monthNumber = monthNames[month.toLowerCase()];

  if (!monthNumber) return value;

  return `${day.padStart(2, "0")}/${monthNumber}/${year}`;
}

// ======================================
// 3. MENGAMBIL DATA LAPORAN
// ======================================

export function parseBoronganData(text) {
  const cleanText = text.replace(/\r/g, "");

  // Mengambil ID laporan
  const idMatch = cleanText.match(
    /ID\s*:\s*(.+?)(?=\s+(?:Total\s+Transaksi|Total\s+Diskon|Setelah\s+Diskon|Jml\s+Transaksi)\s*:|\r?\n|$)/i,
  );

  // Mengambil jumlah transaksi
  const countMatch = cleanText.match(/Jml\s+Transaksi\s*:\s*(\d+)\s*CN/i);

  // Mengambil total transaksi
  const totalMatch = cleanText.match(/Total\s+Transaksi\s*:\s*Rp\.?\s*([\d.,]+)/i);

  // Mengambil total diskon
  const discountMatch = cleanText.match(/Total\s+Diskon\s*:\s*Rp\.?\s*([\d.,]+)/i);

  // Mengambil nominal setelah diskon
  const afterDiscountMatch = cleanText.match(/Setelah\s+Diskon\s*:\s*Rp\.?\s*([\d.,]+)/i);

  // ======================================
  // 4. MENGAMBIL DATA CONNOTE
  // ======================================

  const items = [];

  const lines = cleanText.split("\n");

  lines.forEach((line) => {
    const match = line.match(/^\s*(\d+)\s+(660\d{9})\b.*?([\d,]+)\s*$/);

    if (!match) return;

    items.push({
      no: Number(match[1]),
      connote: match[2],
      cost: parseMoney(match[3]),
    });
  });

  // ======================================
  // 5. VALIDASI DATA
  // ======================================

  const missing = [];

  if (!idMatch) missing.push("ID laporan");
  if (!countMatch) missing.push("Jumlah transaksi");
  if (!totalMatch) missing.push("Total transaksi");
  if (!discountMatch) missing.push("Total diskon");
  if (!afterDiscountMatch) missing.push("Setelah diskon");

  if (items.length === 0) {
    missing.push("Daftar connote");
  }

  if (missing.length > 0) {
    throw new Error(`Data PDF tidak lengkap: ${missing.join(", ")}`);
  }

  // ======================================
  // 6. HASIL AKHIR
  // ======================================

  const reportId = idMatch[1].trim();

  return {
    reportId: idMatch?.[1]?.trim() || "",
    customerName: idMatch?.[1]?.trim() || "",
    transactionCount: countMatch?.[1]?.trim() || "",
    totalTransaction: parseMoney(totalMatch?.[1]),
    totalDiscount: parseMoney(discountMatch?.[1]),
    afterDiscount: parseMoney(afterDiscountMatch?.[1]),
    items,
  };
}

// ======================================
// 7. FUNGSI YANG DIPANGGIL MAIN.JS
// ======================================

export async function readBoronganPdf(file) {
  const text = await extractPdfText(file);

  // Tambahkan di sini
  console.log("HASIL EKSTRAKSI PDF:", text);

  const data = parseBoronganData(text);

  return data;
}
