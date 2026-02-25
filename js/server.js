require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

/* ===============================
   MIDDLEWARES
================================ */
app.use(cors());
app.use(express.json());

/* ===============================
   POSTGRES CONNECTION
================================ */
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

(async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ DB conectada:", res.rows[0].now);
  } catch (err) {
    console.error("❌ Error conectando a DB:", err.message);
  }
})();

/* ===============================
   RUTAS
================================ */

// Ruta base (salud del backend)
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "API Portal de Registro funcionando",
  });
});

// Ruta de prueba DB
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
});

/* ===============================
   SERVER
================================ */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
