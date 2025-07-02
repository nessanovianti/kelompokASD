// index.js
const express = require("express");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); // Untuk menyajikan file statis seperti CSS dan gambar

// Konfigurasi upload gambar
const storage = multer.diskStorage({
    destination: "./public/uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Konfigurasi koneksi MySQL
const db = mysql.createConnection({
    host: "localhost",
    database: "tokosederhana",
    user: "root",
    password: "",
});

db.connect((err) => {
    if (err) throw err;
    console.log("Database connected...");
    // Buat tabel products jika belum ada
    db.query(`
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100),
            price INT,
            stock INT,
            image VARCHAR(255)
        )
    `);
});

// Fungsi untuk menambahkan produk
function addProductToDB(name, price, stock, imageUrl, callback) {
    const sql = "INSERT INTO products (name, price, stock, image) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, price, stock, imageUrl], (err, result) => {
        if (err) return callback(err);
        callback(null, result);
    });
}

// Fungsi untuk mengambil produk
function getProductsFromDB(callback) {
    db.query("SELECT * FROM products", (err, results) => {
        if (err) return callback(err);
        callback(null, results);
    });
}

// Endpoint untuk mengambil daftar produk
app.get("/api/products", (req, res) => {
    getProductsFromDB((err, results) => {
        if (err) {
            res.status(500).send("Error retrieving products");
            return;
        }
        res.json(results);
    });
});

// Endpoint untuk menambahkan produk
app.post("/api/add-product", upload.single("image"), (req, res) => {
    const { name, price, stock } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : "/uploads/default.jpg";
    addProductToDB(name, parseInt(price), parseInt(stock), imageUrl, (err, result) => {
        if (err) {
            res.status(500).send("Error adding product: " + err.message);
            return;
        }
        res.json({ message: "Product added successfully", id: result.insertId });
    });
});
app.get("/", (req, res) => {
    console.log("Route / accessed");
    res.send(`
    `);
});


    app.listen(8000, () => {
    console.log("Server ready on port 8000...");
});
