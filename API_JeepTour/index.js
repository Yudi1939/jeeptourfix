const express = require('express');
const cors = require('cors'); // Import CORS
const mysql = require('mysql2'); // Import MySQL

const app = express();
const PORT = 3000;

// Konfigurasi middleware
app.use(cors()); // Aktifkan CORS untuk semua origin
app.use(express.json()); // Middleware untuk parsing JSON

// Konfigurasi koneksi database MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Ganti dengan username MySQL Anda
    password: '', // Ganti dengan password MySQL Anda
    database: 'jeeptour' // Nama database yang Anda gunakan
});

// Cek koneksi ke database
db.connect((err) => {
    if (err) {
        console.error('Gagal terhubung ke database:', err);
        return;
    }
    console.log('Terhubung ke database MySQL');
});

// CRUD Umum untuk Tabel (users dan driver)
const tables = ['users', 'driver'];

// Create data
tables.forEach((table) => {
    app.post(`/${table}`, (req, res) => {
        const data = req.body;
        const columns = Object.keys(data).join(", ");
        const values = Object.values(data);
        const placeholders = values.map(() => "?").join(", ");

        const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
        db.query(query, values, (err, result) => {
            if (err) {
                console.error(`Error creating ${table} data:`, err);
                return res.status(500).json({ success: false, message: 'Gagal menambah data' });
            }
            res.json({ success: true, message: 'Data berhasil ditambahkan', id: result.insertId });
        });
    });
});

// Read all data
tables.forEach((table) => {
    app.get(`/${table}`, (req, res) => {
        const query = `SELECT * FROM ${table}`;
        db.query(query, (err, results) => {
            if (err) {
                console.error(`Error fetching ${table} data:`, err);
                return res.status(500).json({ success: false, message: 'Gagal mengambil data' });
            }
            res.json({ success: true, data: results });
        });
    });
});

// Read single data
tables.forEach((table) => {
    app.get(`/${table}/:id`, (req, res) => {
        const query = `SELECT * FROM ${table} WHERE id_${table} = ?`;
        db.query(query, [req.params.id], (err, results) => {
            if (err) {
                console.error(`Error fetching ${table} data:`, err);
                return res.status(500).json({ success: false, message: 'Gagal mengambil data' });
            }
            res.json({ success: true, data: results[0] });
        });
    });
});

// Update data
tables.forEach((table) => {
    app.put(`/${table}/:id`, (req, res) => {
        const data = req.body;
        const values = Object.values(data);
        const columns = Object.keys(data).map(col => `${col} = ?`).join(", ");

        const query = `UPDATE ${table} SET ${columns} WHERE id_${table} = ?`;
        db.query(query, [...values, req.params.id], (err, result) => {
            if (err) {
                console.error(`Error updating ${table} data:`, err);
                return res.status(500).json({ success: false, message: 'Gagal memperbarui data' });
            }
            res.json({ success: true, message: 'Data berhasil diperbarui' });
        });
    });
});

// Delete data
tables.forEach((table) => {
    app.delete(`/${table}/:id`, (req, res) => {
        const query = `DELETE FROM ${table} WHERE id_${table} = ?`;
        db.query(query, [req.params.id], (err, result) => {
            if (err) {
                console.error(`Error deleting ${table} data:`, err);
                return res.status(500).json({ success: false, message: 'Gagal menghapus data' });
            }
            res.json({ success: true, message: 'Data berhasil dihapus' });
        });
    });
});

// Endpoint login
app.post('/login', (req, res) => {
    const { email, password, role } = req.body;

    const tableName = role === 'Users' ? 'users' : 'driver'; // Pilih tabel berdasarkan role
    const query = `SELECT * FROM ${tableName} WHERE email = ? AND password = ?`;

    db.query(query, [email, password], (err, results) => {
        if (err) {
            console.error('Error saat login:', err);
            return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
        }

        if (results.length > 0) {
            // Jika login berhasil, kirim token (simulasi) dan data user
            const user = results[0];
            const token = 'fake-jwt-token'; // Gantilah dengan token yang benar jika menggunakan autentikasi JWT

            res.json({
                success: true,
                message: 'Login berhasil',
                token: token,
                user: user
            });
        } else {
            // Jika login gagal
            res.status(401).json({ success: false, message: 'Email atau password salah.' });
        }
    });
});

app.get('/api/kendaraan', (req, res) => {
    const { id_driver } = req.query;

    if (!id_driver) {
        return res.status(400).json({ success: false, message: 'ID driver diperlukan' });
    }

    const query = `SELECT * FROM kendaraan WHERE id_driver = ?`;
    db.query(query, [id_driver], (err, results) => {
        if (err) {
            console.error('Error mengambil data kendaraan:', err);
            return res.status(500).json({ success: false, message: 'Gagal mengambil data kendaraan' });
        }
        
        if (results.length > 0) {
            res.json({ success: true, data: results[0] });
        } else {
            res.status(404).json({ success: false, message: 'Data kendaraan tidak ditemukan' });
        }
    });
});

// Endpoint untuk update data kendaraan berdasarkan id_driver
app.put('/api/kendaraan', (req, res) => {
    const { id_driver, model, license_plate, year } = req.body;

    if (!id_driver || !model || !license_plate || !year) {
        return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }

    const query = `UPDATE kendaraan SET model = ?, license_plate = ?, year = ? WHERE id_driver = ?`;
    db.query(query, [model, license_plate, year, id_driver], (err, result) => {
        if (err) {
            console.error('Error memperbarui data kendaraan:', err);
            return res.status(500).json({ success: false, message: 'Gagal memperbarui data kendaraan' });
        }

        res.json({ success: true, message: 'Data kendaraan berhasil diperbarui' });
    });
});

// Jalankan server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});