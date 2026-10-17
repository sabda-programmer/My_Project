const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
const cors = require('cors');
const nodemon = require('nodemon');

app.use(express.static(path.join(__dirname, "public")));

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/platform-belajar", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "halaman.utama.html"));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});