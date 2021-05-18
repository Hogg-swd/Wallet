const express = require("express");
const sha256 = require('js-sha256');
const app = express();
const blockchain = require('./blockchain')
var bodyParser = require('body-parser');


app.use(express.static("public"))
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/', require('./routes/pages'));

app.listen(5000, () => {
  console.log("Network node started");
})
