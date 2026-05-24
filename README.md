# 📦 Smart Printing: 2D Guillotine Bin Packing Benchmark

![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react)
![Playwright](https://img.shields.io/badge/Playwright-Test-green?style=for-the-badge&logo=playwright)
![Lighthouse](https://img.shields.io/badge/Lighthouse-Performance-orange?style=for-the-badge&logo=lighthouse)

Proyek purwarupa eksperimental ini dirancang khusus untuk menguji, membandingkan, dan mengukur dampak komputasi berat (*compute-heavy*) dari algoritma **2D Guillotine Bin Packing** pada lingkungan peramban modern. 

Tujuan utama proyek ini adalah meneliti fenomena *Main Thread Blocking* dan dampaknya terhadap Web Vitals seperti **Total Blocking Time (TBT)** dan **Interaction to Next Paint (INP)** menggunakan ekosistem Next.js App Router.

---

## 🚀 Fitur Utama

- **Algoritma 2D Guillotine Murni:** Utilitas *pure function* untuk kalkulasi pemosisian kotak dalam container tanpa tumpang tindih.
- **Client-Side Rendering (CSR) Sandbox:** Halaman uji `/test/csr` yang terisolasi untuk mengukur kelumpuhan main thread secara sinkron.
- **Visualisasi Tanpa CLS:** Komponen visual (`LayoutVisualizer`) dengan dimensi absolut (*fixed*) untuk memastikan *Cumulative Layout Shift* selalu `0.0`.
- **Automated Performance E2E Testing:** Otomatisasi pengujian beban dengan Playwright yang dijembatani (*bridged*) secara mulus ke Google Lighthouse melalui protokol CDP.
- **Auto-Report JSON:** Hasil benchmark TBT, INP, TTFB dan komputasi diekstrak dan disimpan secara otomatis.

---

## 📂 Struktur Arsitektur Modular

```text
smart-printing/
├── app/
│   ├── (page)/
│   │   ├── test/csr/page.tsx    # Entry point halaman CSR
│   │   └── test/ssr/page.tsx    # Entry point halaman SSR (Coming Soon)
│   ├── globals.css              # Variabel tema CSS terpusat
│   └── layout.tsx               # Root layout Next.js
├── components/
│   ├── ControlPanel.tsx         # Komponen antarmuka panel kontrol
│   └── LayoutVisualizer.tsx     # Komponen presentasional visualisasi bin packing
├── hooks/
│   └── useBinPacking.ts         # Custom hooks untuk orkestrasi algoritma (CSR)
├── utils/
│   └── guillotineAlgorithm.ts   # Core engine 2D Guillotine Bin Packing
├── tests/
│   ├── benchmark-playwright.mjs # Skrip otomasi hibrida Playwright & Lighthouse
│   └── csr-performance.spec.ts  # Native Playwright Test
└── result-test/                 # Folder penyimpanan otomatis hasil eksekusi (JSON)
```

---

## 🛠️ Prasyarat & Instalasi

Pastikan Anda telah menginstal **Node.js (v24+)** dan **npm**.

```bash
# 1. Klon repositori ini
git clone https://github.com/your-username/smart-printing.git
cd smart-printing

# 2. Instal dependensi Node.js
npm install

# 3. Instal biner browser untuk Playwright
npx playwright install
```

---

## 💻 Menjalankan Aplikasi

Anda dapat menjalankan antarmuka web dalam dua mode:

### Mode Development
Digunakan untuk iterasi pengembangan.
```bash
npm run dev
```
Buka: [http://localhost:3000/test/csr](http://localhost:3000/test/csr)

### Mode Production (Direkomendasikan untuk Pengujian)
Digunakan untuk merepresentasikan performa asli di dunia nyata.
```bash
npm run build
npm run start
```

---

## ⏱️ Eksekusi Benchmark Otomatis

Skrip *benchmark* mengeksekusi pengujian dengan parameter **4x CPU Throttling** dan **Slow 4G Network** untuk mendapatkan presisi Web Vitals terbaik menggunakan metrik Lighthouse (`Timespan` mode).

Pastikan server Anda sedang menyala (`npm run start` atau `npm run dev`), kemudian buka tab terminal baru dan jalankan:

```bash
node tests/benchmark-playwright.mjs --width=1000 --height=1000 --quantity=15
```

### Parameter Skrip:
- `--width`: Lebar container / media cetak utama.
- `--height`: Tinggi container / media cetak utama.
- `--quantity`: Jumlah spesifik untuk dieksekusi secara intensif guna memaksa pelambatan *main thread*.

### Output:
Skrip akan mencetak tabel statistik di terminal dan menyimpan file secara otomatis ke:
`result-test/pengujian-csr-{X}.json`

---

## 📝 Lisensi

Dikembangkan untuk penelitian performa web modern. Seluruh kode tunduk pada lisensi [MIT](LICENSE).
