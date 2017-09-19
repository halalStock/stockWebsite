/*jshint node: true */

var express = require('express');
var app = express();
var request = require('request');
var cheerio = require('cheerio');

app.set('port', (process.env.PORT || 5000));

app.get("/stockScraper.js", function (req, res) {
    console.log("cmon");
    request("https://finance.yahoo.com/quote/NBY/key-statistics?p=NBY", function(error, response, html){
        if(!error){
            console.log("cmon");
            var $ = cheerio.load(html);

            var priceSpan = $('span[data-reactid = "35"]');
            console.log("cmon");
            console.log(priceSpan.text());

        }
    });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});