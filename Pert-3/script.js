// ===== DATA =====
// Data awal diambil dari 4 proyek di halaman sebelumnya (anggaran = contoh, silakan ganti)
let daftarProyek = [
  { id: 1, judul: "Sistem Manajemen Inventori Database", kategori: "Web App", anggaran: 5000000, selesai: true },
  { id: 2, judul: "Aplikasi Kasir & Perhitungan Transaksi", kategori: "Desktop App", anggaran: 3000000, selesai: true },
  { id: 3, judul: "Aplikasi Pencatatan Keuangan", kategori: "Web App", anggaran: 2500000, selesai: false },
  { id: 4, judul: "Aplikasi Pencatatan Data Mahasiswa", kategori: "Web App", anggaran: 4000000, selesai: false },
];

let kataKunci = "";

// ===== ELEMEN DOM =====
const formTambah = document.getElementById("form-tambah");
const inputJudul = document.getElementById("input-judul");
const inputKategori = document.getElementById("input-kategori");
const inputAnggaran = document.getElementById("input-anggaran");
const inputSelesai = document.getElementById("input-selesai");
const pesanError = document.getElementById("pesan-error");
const inputCari = document.getElementById("input-cari");
const wadahDaftar = document.getElementById("daftar-proyek");

// ===== HELPER =====
function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(angka);
}

// Cegah judul yang mengandung tag HTML merusak tampilan
function escapeHtml(teks) {
  return teks
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ===== RENDER =====
function renderStatistik() {
  const total = daftarProyek.length;
  const selesai = daftarProyek.filter((p) => p.selesai).length;
  const totalAnggaran = daftarProyek.reduce((jumlah, p) => jumlah + p.anggaran, 0);

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-selesai").textContent = selesai;
  document.getElementById("stat-proses").textContent = total - selesai;
  document.getElementById("stat-anggaran").textContent = formatRupiah(totalAnggaran);
}

function renderDaftar() {
  // FITUR 2: saring berdasarkan nama proyek
  const hasil = daftarProyek.filter((p) =>
    p.judul.toLowerCase().includes(kataKunci.toLowerCase())
  );

  if (hasil.length === 0) {
    wadahDaftar.innerHTML = `<p class="kosong">Tidak ada proyek yang cocok.</p>`;
    return;
  }

  wadahDaftar.innerHTML = hasil
    .map(
      (p) => `
      <article class="kartu ${p.selesai ? "kartu-selesai" : ""}">
        <h3>${escapeHtml(p.judul)}</h3>
        <p>Kategori: ${p.kategori}</p>
        <p>Anggaran: ${formatRupiah(p.anggaran)}</p>
        <p>Status: <span class="badge ${p.selesai ? "badge-selesai" : "badge-proses"}">${
          p.selesai ? "Selesai" : "Dalam Pengerjaan"
        }</span></p>
        <div class="aksi">
          <button type="button" data-aksi="toggle" data-id="${p.id}">Ubah Status</button>
          <button type="button" data-aksi="hapus" data-id="${p.id}" class="btn-hapus">Hapus Proyek</button>
        </div>
      </article>`
    )
    .join("");
}

function renderSemua() {
  renderStatistik();
  renderDaftar();
}

// ===== FITUR 1: FORM SUBMIT + VALIDASI =====
formTambah.addEventListener("submit", (e) => {
  e.preventDefault();

  const judul = inputJudul.value.trim();
  const anggaran = Number(inputAnggaran.value);

  if (judul === "") {
    pesanError.textContent = "Judul proyek tidak boleh kosong.";
    return;
  }
  if (!(anggaran > 0)) {
    pesanError.textContent = "Estimasi anggaran harus lebih besar dari 0.";
    return;
  }

  pesanError.textContent = "";

  const proyekBaru = {
    id: Date.now(),
    judul,
    kategori: inputKategori.value,
    anggaran,
    selesai: inputSelesai.checked,
  };

  daftarProyek = [...daftarProyek, proyekBaru]; // spread operator

  formTambah.reset();
  renderSemua();
});

// ===== FITUR 2: LIVE SEARCH =====
inputCari.addEventListener("input", (e) => {
  kataKunci = e.target.value;
  renderDaftar();
});

// ===== FITUR 3: AKSI KARTU (event delegation) =====
wadahDaftar.addEventListener("click", (e) => {
  const tombol = e.target.closest("button[data-aksi]");
  if (!tombol) return;

  const id = Number(tombol.dataset.id);

  if (tombol.dataset.aksi === "toggle") {
    daftarProyek = daftarProyek.map((p) =>
      p.id === id ? { ...p, selesai: !p.selesai } : p
    );
  } else if (tombol.dataset.aksi === "hapus") {
    daftarProyek = daftarProyek.filter((p) => p.id !== id);
  }

  renderSemua();
});

// Tampilan awal
renderSemua();