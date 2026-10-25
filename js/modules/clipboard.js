export function setupClipboard({ onImage, onMessage, pasteZone }) {
  // Paste is handled at document level so Ctrl+V works without clicking a specific input.
  document.addEventListener("paste", async (event) => {
    const items = Array.from(event.clipboardData?.items ?? []);
    const imageItem = items.find((item) => item.type.startsWith("image/"));

    if (!imageItem) return;
    event.preventDefault();
    const file = imageItem.getAsFile();
    if (file) await onImage(file);
    else onMessage("Gambar dari clipboard tidak dapat dibaca.");
  });

  pasteZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    pasteZone.classList.add("is-dragover");
  });

  pasteZone.addEventListener("dragleave", () => {
    pasteZone.classList.remove("is-dragover");
  });

  pasteZone.addEventListener("drop", async (event) => {
    event.preventDefault();
    pasteZone.classList.remove("is-dragover");
    const files = Array.from(event.dataTransfer?.files ?? []).filter((file) => file.type.startsWith("image/"));
    for (const file of files) await onImage(file);
    if (!files.length) onMessage("Jatuhkan file gambar untuk menambahkan resi.");
  });
}
