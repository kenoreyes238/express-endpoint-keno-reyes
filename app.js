const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

require('dotenv').config();

const port = 3000;

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Zp07au?2',
  database: 'car'
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

app.get('/cars', async function(req, res) {
  try {
    const [rows] = await req.db.query(`SELECT * FROM car WHERE deleted_flag = 0`);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: 'Failed to fetch cars', data: null });
  }
});

app.post('/car', async function(req, res) {
  try {
    const { make, model, year } = req.body;
  
    const query = await req.db.query(
      `INSERT INTO car (make, model, year) 
       VALUES (:make, :model, :year)`,
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

app.delete('/car/:id', async function(req,res) {
  try {
    const { id } = req.params;
    await req.db.query(`UPDATE car SET deleted_flag = 1 WHERE id = :carId`, [ id ]);
    res.json({ success: true, message: 'Car successfully deleted' });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: 'Car failed to be deleted' });
  }
});

app.put('/car', async function(req,res) {
  try {
    const { id } = req.params;
    const { make, model, year } = req.body;

    await req.db.query(
      `UPDATE car SET make = ?, model = ?, year = ? WHERE id = ?`,
      [make, model, year, id]
    );

    res.json({ success: true, message: 'Car successfully updated', data: null });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: 'Error: could not update car', data: null });   
  }
});


app.listen(port, () => console.log(`212 API Example listening on http://localhost:${port}`));