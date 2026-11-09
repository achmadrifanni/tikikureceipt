function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

export function createReceiptStore() {
  let receipts = [];

  return {
    getAll() {
      return [...receipts];
    },

    async addFile(file) {
      const dataUrl = await readFileAsDataUrl(file);
      const image = new Image();
      image.src = dataUrl;
      await image.decode();

      const receipt = {
        id: createId(),
        name: file.name || "Screenshot resi",
        src: dataUrl,
        width: image.naturalWidth,
        height: image.naturalHeight,
        createdAt: Date.now(),
      };

      receipts = [...receipts, receipt];
      return receipt;
    },

    async addImageData(imageData) {
      if (!imageData?.src) {
        throw new Error("Data gambar tidak ditemukan.");
      }

      // Membaca dimensi gambar PNG
      const image = new Image();
      image.src = imageData.src;

      await image.decode();

      // Membuat objek resi dengan struktur yang sama
      // seperti gambar hasil upload biasa
      const receipt = {
        id: createId(),
        name: imageData.name || "Ringkasan Borongan.png",
        src: imageData.src,
        width: image.naturalWidth,
        height: image.naturalHeight,
        createdAt: Date.now(),
      };

      receipts = [...receipts, receipt];

      return receipt;
    },

    remove(id) {
      receipts = receipts.filter((receipt) => receipt.id !== id);
    },

    clear() {
      receipts = [];
    },
  };
}
