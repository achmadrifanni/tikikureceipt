function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[char];
  });
}

// Format nominal menjadi Rupiah
function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

// Membuat tampilan ringkasan PDF
export function renderBoronganSummary(data, container) {
  const transactionRows = data.items
    .map(
      (item) => `
      <tr>
        <td>${escapeHTML(item.no)}</td>
        <td>${escapeHTML(item.connote)}</td>
        <td>${escapeHTML(formatRupiah(item.cost))}</td>
      </tr>
    `,
    )
    .join("");

  container.innerHTML = `
    <article class="borongan-summary">

      <header class="borongan-summary__header">
        <h3>LAPORAN KIRIMAN BORONGAN</h3>
        <p>RINGKASAN TRANSAKSI</p>
      </header>

        <section class="borongan-summary__identity">
            <div>
                <span>ID PELANGGAN</span>
                <strong>${escapeHTML(data.reportId)}</strong>
            </div>

            <div>
                <span>JUMLAH TRANSAKSI</span>
                <strong>${escapeHTML(data.transactionCount)}</strong>
            </div>
        </section>

      <section class="borongan-summary__stats">

        <div class="borongan-summary__stat">
          <span>Total transaksi</span>
          <strong>${escapeHTML(formatRupiah(data.totalTransaction))}</strong>
        </div>

        <div class="borongan-summary__stat">
          <span>Total diskon</span>
          <strong>${escapeHTML(formatRupiah(data.totalDiscount))}</strong>
        </div>

        <div class="borongan-summary__stat borongan-summary__stat--total">
          <span>Setelah diskon</span>
          <strong>${escapeHTML(formatRupiah(data.afterDiscount))}</strong>
        </div>

      </section>

      <section class="borongan-summary__table-section">
        <h4>Rincian transaksi</h4>

        <table class="borongan-summary__table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Connote</th>
              <th>Biaya</th>
            </tr>
          </thead>

          <tbody>
            ${transactionRows}
          </tbody>
        </table>
      </section>

      <footer class="borongan-summary__footer">
        <span>RINGKASAN LAPORAN BORONGAN</span>
      </footer>

    </article>
  `;
}

export async function convertSummaryToImage(container) {
  // Cari elemen ringkasan HTML
  const summary = container.querySelector(".borongan-summary");

  if (!summary) {
    throw new Error("Elemen ringkasan PDF tidak ditemukan.");
  }

  // Pastikan font sudah selesai dimuat
  await document.fonts.ready;

  // Ubah HTML menjadi Canvas
  const canvas = await window.html2canvas(summary, {
    backgroundColor: "#ffffff",
    scale: 3,
    useCORS: true,
    logging: false,
  });

  // Ubah Canvas menjadi gambar PNG
  const imageSrc = canvas.toDataURL("image/png");

  return {
    src: imageSrc,
    width: canvas.width,
    height: canvas.height,
    name: "Ringkasan Borongan.png",
  };
}
