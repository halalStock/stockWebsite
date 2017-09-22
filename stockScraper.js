/*jshint node: true */

var express = require('express');
var app = express();
var request = require('request');
var cheerio = require('cheerio');

app.set('port', (process.env.PORT || 5000));

function getDebt(symbol) {
     request("https://finance.yahoo.com/quote/"+symbol+"/key-statistics?p="+symbol, function(error, response, html){
        if(!error){
            var $ = cheerio.load(html);

            var priceSpan = $('span[data-reactid = "35"]');
            return priceSpan.text().replace(/[^\d.-]/g,'');

        }
    });
}



app.get("/stockScraper.js", function (req, res) {
    
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});