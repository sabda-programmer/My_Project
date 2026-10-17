const express = require('express');
const app = express();
const port = 5000;
const bodyParser = require('body-parser');

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello sabda');
});

app.post('/login', (req, res) => {
    console.log({ requestFrom: req.body })
    res.send('login berhasil')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});