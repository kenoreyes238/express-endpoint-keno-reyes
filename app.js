const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

require('dotenv').config();

const port = process.env.PORT;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

app.use(async function(req, res, next) {
  try {
    req.db = await pool.getConnection();
    req.db.connection.config.namedPlaceholders = true;

    await req.db.query(`SET SESSION sql_mode = "TRADITIONAL"`);
    await req.db.query(`SET time_zone = '-8:00'`);

    await next();

    req.db.release();
  } catch (err) {
    console.log(err);

    if (req.db) req.db.release();
    throw err;
  }
});

app.use(cors());

app.use(express.json());

app.get('/cars', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM car WHERE deleted_flag = 0');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/car', async function(req, res) {
  try {
    const { make, model, year } = req.body;
  
    const query = await req.db.query(
      `INSERT INTO car (make, model, year, deleted_flag) 
       VALUES (:make, :model, :year, 0)`,
      {
        make,
        model,
        year,
      }
    );
  
    res.json({ success: true, message: 'Car successfully created', data: null });
  } catch (err) {
    res.json({ success: false, message: err, data: null })
  }
});

app.put('/car/:id', async function(req, res) {
  try {
    const { id } = req.params;
    const { make, model, year } = req.body;
    await req.db.query(
      `UPDATE car SET make = ?, model = ?, year = ? WHERE id = ?`,
      [make, model, year, id]
    );
    res.json({ success: true, message: 'Car successfully updated' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: 'Failed to update car' });
  }
});

app.delete('/car/:id', async function(req, res) {
  try {
    const { id } = req.params;
    await req.db.query(`UPDATE car SET deleted_flag = 1 WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Car successfully deleted' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: 'Failed to delete car' });
  }
});


app.listen(port, () => console.log(`212 API Example listening on http://localhost:${port}`));