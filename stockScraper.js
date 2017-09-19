var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.get("/stockScraper.js", function (req, res) {
    console.log("cmon");
});