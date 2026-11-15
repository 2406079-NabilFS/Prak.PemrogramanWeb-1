// File: public/script.js - Logika Client-Side JavaScript CRUD
document.addEventListener("DOMContentLoaded", () => {
  // ============================================================
  // 1. TANGKAP ELEMEN DOM
  // ============================================================
  const mhsForm      = document.querySelector("#mhsForm");
  const mhsIdInput   = document.querySelector("#mhsId");
  const nimInput     = document.querySelector("#nim");
  const namaInput    = document.querySelector("#nama");
  const jurusanInput = document.querySelector("#jurusan");
  const emailInput   = document.querySelector("#email");
  const btnSubmit    = document.querySelector("#btnSubmit");
  const btnCancel    = document.querySelector("#btnCancel");
  const formTitle    = document.querySelector("#formTitle");
  const mhsTableBody = document.querySelector("#mhsTableBody");
  const alertMessage = document.querySelector("#alertMessage");

  let listMahasiswa = [];

  // ============================================================
  // 2. HELPER FUNCTIONS
  // ============================================================
  const showAlert = (text, type = "success") => {
    alertMessage.textContent = text;
    alertMessage.className = `alert alert-${type}`;
    alertMessage.style.display = "block";
    clearTimeout(showAlert._timer);
    showAlert._timer = setTimeout(() => {
      alertMessage.style.display = "none";
    }, 3000);
  };

  // Escape HTML untuk mencegah XSS saat render data dari server
  const escapeHtml = (str) => {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Parse JSON dengan aman; lempar error jika response bukan JSON
  const parseJsonSafe = async (res) => {
    try {
      return await res.json();
    } catch {
      return { success: false, message: `Response tidak valid (HTTP ${res.status})` };
    }
  };

  // ============================================================
  // 3. RESET FORM (dideklarasikan lebih awal agar bisa dipakai)
  // ============================================================
  const resetForm = () => {
    mhsForm.reset();
    mhsIdInput.value = "";
    formTitle.textContent = "Tambah Mahasiswa Baru";
    btnSubmit.textContent = "Simpan Mahasiswa";
    btnCancel.style.display = "none";
  };

  // ============================================================
  // 4. RENDER TABLE
  // ============================================================
  const renderTable = (data) => {
    mhsTableBody.innerHTML = "";

    if (!data || data.length === 0) {
      mhsTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; color:#64748b;">
            Belum ada data mahasiswa tersimpan.
          </td>
        </tr>`;
      return;
    }

    const fragment = document.createDocumentFragment();

    data.forEach((mhs, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${escapeHtml(mhs.nim)}</td>
        <td>${escapeHtml(mhs.nama)}</td>
        <td>${escapeHtml(mhs.jurusan)}</td>
        <td>${escapeHtml(mhs.email)}</td>
        <td>
          <button class="btn-action btn-edit"   data-id="${mhs.id}">Edit</button>
          <button class="btn-action btn-delete" data-id="${mhs.id}">Hapus</button>
        </td>`;
      fragment.appendChild(tr);
    });

    mhsTableBody.appendChild(fragment);
  };

  // ============================================================
  // 5. READ: Ambil data mahasiswa dari API
  // ============================================================
  const loadMahasiswa = async () => {
    try {
      const res = await fetch("/api/mahasiswa");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      listMahasiswa = Array.isArray(data) ? data : [];
      renderTable(listMahasiswa);
    } catch (err) {
      console.error("loadMahasiswa error:", err);
      showAlert("Gagal memuat data dari server backend.", "error");
    }
  };

  // ============================================================
  // 6. CREATE & UPDATE: Submit Form
  // ============================================================
  mhsForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      nim:     nimInput.value.trim(),
      nama:    namaInput.value.trim(),
      jurusan: jurusanInput.value,
      email:   emailInput.value.trim(),
    };

    const id     = mhsIdInput.value;
    const isEdit = Boolean(id);
    const url    = isEdit ? `/api/mahasiswa/${id}` : "/api/mahasiswa";
    const method = isEdit ? "PUT" : "POST";

    btnSubmit.disabled = true;
    const originalText = btnSubmit.textContent;
    btnSubmit.textContent = isEdit ? "Memperbarui..." : "Menyimpan...";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await parseJsonSafe(res);

      if (res.ok && result.success) {
        showAlert(result.message || "Data berhasil disimpan.");
        resetForm();
        await loadMahasiswa();
      } else {
        showAlert("Terjadi kesalahan: " + (result.message || "Tidak diketahui"), "error");
      }
    } catch (err) {
      console.error("submit error:", err);
      showAlert("Gagal mengirim data ke server.", "error");
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = originalText;
    }
  });

  // ============================================================
  // 7. EVENT DELEGATION: Edit & Delete
  // ============================================================
  mhsTableBody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;

    const id = Number(btn.dataset.id);
    if (!Number.isFinite(id)) return;

    // ----- Mode EDIT -----
    if (btn.classList.contains("btn-edit")) {
      const targetMhs = listMahasiswa.find((m) => m.id === id);
      if (!targetMhs) {
        showAlert("Data mahasiswa tidak ditemukan.", "error");
        return;
      }

      mhsIdInput.value   = targetMhs.id;
      nimInput.value     = targetMhs.nim;
      namaInput.value    = targetMhs.nama;
      jurusanInput.value = targetMhs.jurusan;
      emailInput.value   = targetMhs.email;

      formTitle.textContent  = "Edit Data Mahasiswa";
      btnSubmit.textContent  = "Perbarui Mahasiswa";
      btnCancel.style.display = "inline-block";

      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // ----- Mode DELETE -----
    if (btn.classList.contains("btn-delete")) {
      const targetMhs = listMahasiswa.find((m) => m.id === id);
      const label = targetMhs
        ? `"${targetMhs.nama}" (NIM: ${targetMhs.nim})`
        : "ini";

      if (!confirm(`Apakah Anda yakin ingin menghapus data mahasiswa ${label}?`)) {
        return;
      }

      try {
        const res    = await fetch(`/api/mahasiswa/${id}`, { method: "DELETE" });
        const result = await parseJsonSafe(res);

        if (res.ok && result.success) {
          showAlert(result.message || "Data berhasil dihapus.");
          // Jika sedang mengedit data yang dihapus, reset form
          if (String(mhsIdInput.value) === String(id)) resetForm();
          await loadMahasiswa();
        } else {
          showAlert("Gagal menghapus: " + (result.message || "Tidak diketahui"), "error");
        }
      } catch (err) {
        console.error("delete error:", err);
        showAlert("Gagal menghapus data dari server.", "error");
      }
    }
  });

  // ============================================================
  // 8. TOMBOL BATAL
  // ============================================================
  btnCancel.addEventListener("click", resetForm);

  // ============================================================
  // 9. INISIALISASI
  // ============================================================
  btnCancel.style.display = "none"; // pastikan tersembunyi saat awal
  loadMahasiswa();
});