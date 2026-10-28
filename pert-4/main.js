// File: main.js
// Portofolio Proyek: Form Dinamis, Live Search, dan Aksi Kartu

let projects = [
  { id: 1, title: "Sistem Inventaris Keuangan", category: "Web App", budget: 2500000, completed: true },
  { id: 2, title: "Sistem Kasir Digital POS", category: "Desktop App", budget: 5000000, completed: true },
  { id: 3, title: "Landing Page Profil Perusahaan", category: "Web App", budget: 1500000, completed: false },
  { id: 4, title: "Aplikasi Presensi GPS Mobile", category: "Mobile App", budget: 4500000, completed: true },
  { id: 5, title: "Aplikasi Presensi Face Recognition", category: "Mobile App", budget: 7500000, completed: false }
];

// State tampilan: kategori aktif + kata kunci pencarian
let activeCategory = "Semua";
let searchQuery = "";

const formatRupiah = (angka) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(angka);
};

// Mencegah judul berisi tag HTML merusak tampilan (karena dirender via innerHTML)
const escapeHTML = (text) => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

const updateStats = (dataList) => {
  const totalBudget = dataList.reduce((acc, curr) => acc + curr.budget, 0);
  const completedCount = dataList.filter(item => item.completed).length;

  document.getElementById("stat-total-projects").textContent = dataList.length;
  document.getElementById("stat-total-budget").textContent = formatRupiah(totalBudget);
  document.getElementById("stat-completed-projects").textContent = completedCount;
};

const renderProjects = (list) => {
  const container = document.getElementById("project-list");
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = "<p style='text-align: center; color: #64748b; padding: 20px;'>Tidak ada proyek yang cocok.</p>";
    return;
  }

  container.innerHTML = list.map(proj => {
    const badgeClass = proj.completed ? "badge-success" : "badge-pending";
    const statusText = proj.completed ? "Selesai" : "Dalam Pengerjaan";

    return `
      <div class="project-card">
        <div class="project-info">
          <span class="project-category">${proj.category}</span>
          <h4>${escapeHTML(proj.title)}</h4>
          <p class="project-budget">${formatRupiah(proj.budget)}</p>
        </div>
        <div class="project-right">
          <span class="badge ${badgeClass}">${statusText}</span>
          <div class="actions">
            <button class="btn-action btn-toggle" data-id="${proj.id}">Ubah Status</button>
            <button class="btn-action btn-delete" data-id="${proj.id}">Hapus Proyek</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
};

// Satu fungsi untuk menyegarkan seluruh tampilan setelah data/filter/pencarian berubah.
// Daftar disaring gabungan: kategori aktif + kata kunci pencarian.
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

  // --- Filter kategori ---
  const filterButtons = document.querySelectorAll(".btn-filter");
  filterButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      filterButtons.forEach(b => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      activeCategory = e.currentTarget.getAttribute("data-category");
      refreshView();
    });
  });

  // --- Fitur 2: Live search ---
  document.getElementById("search-input").addEventListener("input", (e) => {
    searchQuery = e.target.value.trim();
    refreshView();
  });

  // --- Fitur 1: Form tambah proyek ---
  const form = document.getElementById("project-form");
  const errorBox = document.getElementById("form-error");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("input-title").value.trim();
    const category = document.getElementById("input-category").value;
    const budget = Number(document.getElementById("input-budget").value);
    const completed = document.getElementById("input-completed").checked;

    // Validasi
    if (title === "") {
      errorBox.textContent = "Judul proyek tidak boleh kosong.";
      return;
    }
    if (!(budget > 0)) {
      errorBox.textContent = "Estimasi anggaran harus lebih besar dari 0.";
      return;
    }
    errorBox.textContent = "";

    const newProject = { id: Date.now(), title, category, budget, completed };
    projects = [...projects, newProject]; // spread operator

    form.reset();
    refreshView();
  });

  // --- Fitur 3: Aksi kartu (event delegation) ---
  document.getElementById("project-list").addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-action");
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