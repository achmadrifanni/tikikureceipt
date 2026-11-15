function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ======================================
// 1. MEMBUKA DATABASE INDEXEDDB
// ======================================

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("TikiKuReceiptDB", 1);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains("snapshots")) {
        db.createObjectStore("snapshots", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ======================================
// 2. MEMBACA FILE GAMBAR
// ======================================

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(String(reader.result)));

    reader.addEventListener("error", () => reject(reader.error));

    reader.readAsDataURL(file);
  });
}

// ======================================
// 3. RECEIPT STORE
// ======================================

export function createReceiptStore() {
  let receipts = [];
  let dbPromise;

  function getDatabase() {
    if (!dbPromise) {
      dbPromise = openDatabase();
    }

    return dbPromise;
  }

  // Menyimpan seluruh pekerjaan terbaru
  async function saveSnapshot() {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction("snapshots", "readwrite");

      transaction.objectStore("snapshots").put({
        id: "current",
        receipts,
        savedAt: Date.now(),
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  // Menghapus backup
  async function deleteSnapshot() {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction("snapshots", "readwrite");

      transaction.objectStore("snapshots").delete("current");

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  return {
    getAll() {
      return [...receipts];
    },

    // ======================================
    // 4. MEMERIKSA BACKUP SEBELUMNYA
    // ======================================

    async getRecoverySnapshot() {
      const db = await getDatabase();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction("snapshots", "readonly");
        const request = transaction.objectStore("snapshots").get("current");

        request.onsuccess = () => {
          const snapshot = request.result;

          if (snapshot?.receipts?.length) {
            resolve(snapshot);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => reject(request.error);
      });
    },

    // ======================================
    // 5. MEMULIHKAN DATA
    // ======================================

    async restore(snapshot) {
      receipts = snapshot.receipts;
      await saveSnapshot();
    },

    async discardRecovery() {
      await deleteSnapshot();
    },

    // ======================================
    // 6. MENAMBAHKAN GAMBAR
    // ======================================

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

      await saveSnapshot();
      console.log("BACKUP BERHASIL DISIMPAN:", receipts.length);
      return receipt;
    },

    async addImageData(imageData) {
      if (!imageData?.src) {
        throw new Error("Data gambar tidak ditemukan.");
      }

      const image = new Image();
      image.src = imageData.src;

      await image.decode();

      const receipt = {
        id: createId(),
        name: imageData.name || "Ringkasan Borongan.png",
        src: imageData.src,
        width: image.naturalWidth,
        height: image.naturalHeight,
        createdAt: Date.now(),
      };

      receipts = [...receipts, receipt];

      await saveSnapshot();

      return receipt;
    },

    // ======================================
    // 7. MENGHAPUS GAMBAR
    // ======================================

    async remove(id) {
      receipts = receipts.filter((receipt) => receipt.id !== id);

      if (receipts.length === 0) {
        await deleteSnapshot();
      } else {
        await saveSnapshot();
      }
    },

    async clear() {
      receipts = [];
      await deleteSnapshot();
    },
  };
}
