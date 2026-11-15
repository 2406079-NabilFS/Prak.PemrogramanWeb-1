// File: server.js - Backend Node.js Express & MySQL
const express = require("express");
const mysql = require("mysql2");

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// 1. KONFIGURASI DATABASE
// ============================================================
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "", // default MySQL Laragon: kosong
  database: process.env.DB_NAME || "db_kampus",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Gunakan pool agar lebih aman & efisien (auto-reconnect, tidak putus saat idle)
const db = mysql.createPool(dbConfig);

// Tes koneksi sekali saat startup
db.getConnection((err, conn) => {
  if (err) {
    console.error("❌ Koneksi database gagal:", err.message);
    process.exit(1);
  }
  console.log("✅ Terhubung ke database MySQL Laragon");
  conn.release();
});

// ============================================================
// 2. MIDDLEWARE
// ============================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // dukung form-urlencoded
app.use(express.static("public"));

// ============================================================
// 3. HELPER VALIDASI
// ============================================================
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateMahasiswa = ({ nim, nama, jurusan, email }) => {
  const errors = [];

  if (!nim || typeof nim !== "string" || nim.trim() === "") {
    errors.push("NIM wajib diisi.");
  } else if (nim.trim().length > 20) {
    errors.push("NIM maksimal 20 karakter.");
  }

  if (!nama || typeof nama !== "string" || nama.trim() === "") {
    errors.push("Nama wajib diisi.");
  } else if (nama.trim().length > 100) {
    errors.push("Nama maksimal 100 karakter.");
  }

  if (!jurusan || typeof jurusan !== "string" || jurusan.trim() === "") {
    errors.push("Jurusan wajib dipilih.");
  }

  if (!email || typeof email !== "string" || email.trim() === "") {
    errors.push("Email wajib diisi.");
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.push("Format email tidak valid.");
  }

  return errors;
};

// Normalisasi payload: trim semua string
const sanitizePayload = (body) => ({
  nim: (body.nim || "").toString().trim(),
  nama: (body.nama || "").toString().trim(),
  jurusan: (body.jurusan || "").toString().trim(),
  email: (body.email || "").toString().trim(),
});

// Terjemahkan error MySQL ke pesan yang ramah
const friendlyDbError = (err) => {
  if (err.code === "ER_DUP_ENTRY") return "NIM sudah terdaftar, gunakan NIM lain.";
  if (err.code === "ER_NO_SUCH_TABLE")
    return "Tabel 'mahasiswa' tidak ditemukan. Pastikan database sudah dibuat.";
  return err.message;
};

// ============================================================
// 4. READ: Ambil seluruh data mahasiswa
// ============================================================
app.get("/api/mahasiswa", (req, res) => {
  db.query("SELECT * FROM mahasiswa ORDER BY id DESC", (err, results) => {
    if (err) {
      console.error("GET /api/mahasiswa:", err);
      return res.status(500).json({
        success: false,
        message: friendlyDbError(err),
      });
    }
    // Mengembalikan array langsung agar kompatibel dengan frontend saat ini
    res.json(results);
  });
});

// ============================================================
// 5. CREATE: Tambah mahasiswa baru
// ============================================================
app.post("/api/mahasiswa", (req, res) => {
  const payload = sanitizePayload(req.body);
  const errors = validateMahasiswa(payload);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join(" "),
    });
  }

  const sql =
    "INSERT INTO mahasiswa (nim, nama, jurusan, email) VALUES (?, ?, ?, ?)";

  db.query(
    sql,
    [payload.nim, payload.nama, payload.jurusan, payload.email],
    (err, result) => {
      if (err) {
        console.error("POST /api/mahasiswa:", err);
        return res.status(500).json({
          success: false,
          message: friendlyDbError(err),
        });
      }
      res.status(201).json({
        success: true,
        message: "Data mahasiswa berhasil disimpan!",
        data: { id: result.insertId, ...payload },
      });
    }
  );
});

// ============================================================
// 6. UPDATE: Ubah data mahasiswa
// ============================================================
app.put("/api/mahasiswa/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "ID tidak valid." });
  }

  const payload = sanitizePayload(req.body);
  const errors = validateMahasiswa(payload);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join(" "),
    });
  }

  const sql =
    "UPDATE mahasiswa SET nim = ?, nama = ?, jurusan = ?, email = ? WHERE id = ?";

  db.query(
    sql,
    [payload.nim, payload.nama, payload.jurusan, payload.email, id],
    (err, result) => {
      if (err) {
        console.error("PUT /api/mahasiswa/:id:", err);
        return res.status(500).json({
          success: false,
          message: friendlyDbError(err),
        });
      }
      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Data mahasiswa tidak ditemukan." });
      }
      res.json({
        success: true,
        message: "Data mahasiswa berhasil diperbarui!",
      });
    }
  );
});

// ============================================================
// 7. DELETE: Hapus data mahasiswa
// ============================================================
app.delete("/api/mahasiswa/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: "ID tidak valid." });
  }

  db.query("DELETE FROM mahasiswa WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("DELETE /api/mahasiswa/:id:", err);
      return res.status(500).json({
        success: false,
        message: friendlyDbError(err),
      });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Data mahasiswa tidak ditemukan." });
    }
    res.json({ success: true, message: "Data mahasiswa berhasil dihapus!" });
  });
});

// ============================================================
// 8. 404 & ERROR HANDLER
// ============================================================
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint tidak ditemukan." });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
});

// ============================================================
// 9. START SERVER
// ============================================================
const server = app.listen(PORT, () => {
  console.log(`🚀 Server CRUD aktif di http://localhost:${PORT}`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${signal} diterima, menutup server...`);
  server.close(() => {
    db.end(() => {
      console.log("Koneksi DB ditutup. Bye!");
      process.exit(0);
    });
  });
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));