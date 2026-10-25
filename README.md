# Receipt Collator — Starter Pack

Starter project HTML, CSS, dan JavaScript murni untuk mengumpulkan screenshot resi, menghapus resi, melihat preview A4, dan mencetak melalui browser.

## Menjalankan proyek

1. Ekstrak ZIP ini.
2. Buka folder proyek di VS Code.
3. Jalankan `index.html` menggunakan ekstensi Live Server.
4. Ambil screenshot resi dengan `Win + Shift + S`.
5. Kembali ke halaman aplikasi lalu tekan `Ctrl + V`.
6. Gunakan tombol `×` untuk menghapus satu resi atau **Hapus semua** untuk mengosongkan daftar.
7. Klik **Cetak A4** untuk membuka dialog cetak browser.

## Struktur folder

```text
receipt-collator/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   └── modules/
│       ├── clipboard.js
│       ├── receipts.js
│       ├── receipt-list.js
│       └── print.js
└── README.md
```

## Pembagian tanggung jawab

- `index.html`: struktur halaman.
- `css/style.css`: tampilan aplikasi, preview, responsif, dan CSS cetak.
- `js/main.js`: menghubungkan modul dan memperbarui UI.
- `clipboard.js`: paste, drag-and-drop.
- `receipts.js`: data resi sementara di memori.
- `receipt-list.js`: daftar thumbnail dan tombol hapus.
- `print.js`: preview halaman dan pemanggilan dialog cetak.

## Catatan penting untuk versi starter

- Data disimpan dalam memori browser. Refresh atau menutup tab akan menghapus daftar.
- Preview memakai pembagian sederhana, maksimal 8 resi per halaman sebagai nilai awal. Ini **belum** merupakan auto-fit berbasis tinggi gambar yang presisi. Ukuran dan jumlah perlu diuji memakai screenshot resi sebenarnya.
- Untuk hasil cetak, di dialog Chrome pilih kertas **A4**, orientasi **Portrait**, margin **None** jika printer mendukung, dan nonaktifkan header/footer. CSS sudah mencoba mengatur ukuran halaman ke A4.
- Jika modul JavaScript tidak berjalan saat membuka file langsung, jalankan melalui Live Server.
- Starter ini tidak mengunggah gambar ke server. Gambar diproses di browser lokal.

## Pengembangan berikutnya

1. Mengukur tinggi gambar untuk mengisi dua kolom secara dinamis tanpa menimpa batas halaman.
2. Mengatur lebar maksimum dan jarak resi berdasarkan hasil uji cetak.
3. Menambah tombol hapus semua dengan konfirmasi.
4. Menambahkan penyimpanan opsional menggunakan IndexedDB jika resi perlu bertahan setelah refresh.
