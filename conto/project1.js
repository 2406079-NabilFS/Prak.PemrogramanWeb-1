// File: project1.js
// Form dinamis, live search, dan aksi kartu (Ubah Status / Hapus)

let projects = [
  { id: 1, title: "Sistem Manajemen Inventori Database", category: "Web App", budget: 2500000, completed: true },
  { id: 2, title: "Aplikasi Kasir & Perhitungan Transaksi", category: "Desktop App", budget: 5000000, completed: true },
  { id: 3, title: "Aplikasi Pencatatan Keuangan", category: "Web App", budget: 1500000, completed: false },
  { id: 4, title: "Aplikasi Pencatatan Data Mahasiswa", category: "Web App", budget: 3000000, completed: false }
];

let searchQuery = "";
let activeCategory = "Semua";

const formatRupiah = (angka) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);

// Judul dirender lewat innerHTML, jadi karakter HTML harus di-escape
const escapeHTML = (text) => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

const updateStats = (list) => {
  document.getElementById("stat-total").textContent = list.length;
  document.getElementById("stat-budget").textContent =
    formatRupiah(list.reduce((sum, p) => sum + p.budget, 0));
  document.getElementById("stat-done").textContent = list.filter(p => p.completed).length;
};

const renderProjects = (list) => {
  const container = document.getElementById("project-list");

  if (list.length === 0) {
    container.innerHTML = '<p class="empty">Tidak ada proyek yang cocok.</p>';
    return;
  }

  container.innerHTML = list.map(p => `
    <div class="card">
      <div>
        <h3>${escapeHTML(p.title)}</h3>
        <p>${p.category} | ${formatRupiah(p.budget)}</p>
      </div>
      <div class="card-side">
        <span class="status ${p.completed ? "done" : "progress"}">
          ${p.completed ? "Selesai" : "Dalam Pengerjaan"}
        </span>
        <div class="card-actions">
          <button type="button" class="btn-toggle" data-id="${p.id}">Ubah Status</button>
          <button type="button" class="btn-delete" data-id="${p.id}">Hapus Proyek</button>
        </div>
      </div>
    </div>
  `).join("");
};

// Satu pintu untuk memperbarui seluruh tampilan
const refreshView = () => {
  const keyword = searchQuery.toLowerCase();

  const visible = projects
    .filter(p => activeCategory === "Semua" || p.category === activeCategory)
    .filter(p => p.title.toLowerCase().includes(keyword));

  renderProjects(visible);
  updateStats(projects);
};

document.addEventListener("DOMContentLoaded", () => {
  refreshView();

  // Fitur 2: live search + filter kategori
  document.getElementById("search-input").addEventListener("input", (e) => {
    searchQuery = e.target.value.trim();
    refreshView();
  });

  document.getElementById("filter-category").addEventListener("change", (e) => {
    activeCategory = e.target.value;
    refreshView();
  });

  // Fitur 1: form tambah proyek
  const form = document.getElementById("project-form");
  const errorBox = document.getElementById("form-error");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("input-title").value.trim();
    const category = document.getElementById("input-category").value;
    const budget = Number(document.getElementById("input-budget").value);
    const completed = document.getElementById("input-completed").checked;

    if (title === "") {
      errorBox.textContent = "Judul proyek tidak boleh kosong.";
      return;
    }
    if (!(budget > 0)) {
      errorBox.textContent = "Estimasi anggaran harus lebih besar dari 0.";
      return;
    }
    errorBox.textContent = "";

    projects = [...projects, { id: Date.now(), title, category, budget, completed }];

    form.reset();
    refreshView();
  });

  // Reset juga membersihkan pesan error
  form.addEventListener("reset", () => { errorBox.textContent = ""; });

  // Fitur 3: Ubah Status & Hapus (event delegation)
  document.getElementById("project-list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;

    const id = Number(btn.dataset.id);

    if (btn.classList.contains("btn-toggle")) {
      projects = projects.map(p => p.id === id ? { ...p, completed: !p.completed } : p);
    } else if (btn.classList.contains("btn-delete")) {
      projects = projects.filter(p => p.id !== id);
    }

    refreshView();
  });
});