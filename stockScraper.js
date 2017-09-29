/*jshint node: true */

var express = require('express');
var app = express();
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
app.set('port', (process.env.PORT || 5000));
var pg = require('pg');

/*function filterCompanies(ccb, companies) {   // SHOULD BE CALLED RESEARCH COMPANY
    var relevantValues = ["Total Debt", "Total Debt/Equity"];
    console.log("filter companies called");
    async.filter(companies, function(comp, callback) {
        request("https://finance.yahoo.com/quote/"+comp.tag+"/key-statistics?p="+comp.tag, function(error, response, html) {
            if(!error){
                var $ = cheerio.load(html);

                //this possibly could be improved by finding out how to call functions on objects using $() to get it instaed of array[selector]
                $("tr").each(function(r, tr) { //loops through all trs in object
                    var valuable = false;
                    var nameSpan;
                    $("td", tr).each(function(d, td) { //loops through all td children, only should be two
                        if (valuable) { //valuable is true if label is found to be of use
                            comp[nameSpan] = $(td).text();
                        } else {
                            nameSpan = $("span", this).text(); //gets namespan from first td, sees if its valuable information
                            if (relevantValues.includes(nameSpan)) {
                                valuable = true;
                            }
                        }
                    });
                });
                console.log("iterating");
                if ((comp["Total Debt"] == "N/A" && comp["Total Debt/Equity"] == "N/A") || (parseFloat(comp["Total Debt/Equity"]) < 20)) {
                    callback(null, true);
                } else {
                    callback(null, false);
                }

            } else {
                console.log('error');
                callback(null, false);
            }
        });
    }, function(error, results) {
        console.log("done with other shit");
        debtFree = results;
        ccb(error);
    });

}*/

function scrapeSymbols() { //will have initiate which reads from json and scrape which will read from nasdaq or w/e
    /*var tempCompanies = [{tag:"ALP^Q"}, {tag:"NBY"}];
    console.log("finished inti");
    ccb(null, tempCompanies);*/
    var tempTag;
    console.log("scrape symbols called");
    var scrapedTags = [];
    request("http://www.nasdaq.com/screening/companies-by-region.aspx?region=North+America&pagesize=10000", function(error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);
            $("h3").each(function(counter, h3) {
                tempTag = $("a", h3).text().trim();
                scrapedTags.push(tempTag);
            });
            console.log("before" + scrapedTags.length);
            saveSymbols(scrapedTags);
            console.log("after" + scrapedTags.length);
        }
        //filterCompanies(ccb,scrapedComps);
    });

}

function checkDebt(tag, callback) { // try making this based off of arrays and settting arrays to null when done
    var comp = {};
    request("https://finance.yahoo.com/quote/"+tag+"/key-statistics?p="+tag, function(error, response, html) {
        if(!error){
            var $ = cheerio.load(html);

            //this possibly could be improved by finding out how to call functions on objects using $() to get it instaed of array[selector]
            $("tr").each(function(r, tr) { //loops through all trs in object
                var valuable = false;
                var nameSpan;
                $("td", tr).each(function(d, td) { //loops through all td children, only should be two
                    if (valuable) { //valuable is true if label is found to be of use
                        comp[nameSpan] = $(td).text();
                    } else {
                        nameSpan = $("span", this).text(); //gets namespan from first td, sees if its valuable information
                        if (nameSpan == "Total Debt" || nameSpan == "Total Debt/Equity") {
                            valuable = true;
                        }
                    }
                });
            });
            callback(null, (comp["Total Debt"] == "N/A" && comp["Total Debt/Equity"] == "N/A") || (parseFloat(comp["Total Debt/Equity"]) < 20), tag);
        } else {
            console.log('error connecting to yahoo, tag: ' + tag);
            return null;
        }
    });
}

function saveSymbols(symbols) {
    var client = new pg.Client(process.env.DATABASE_URL);//"export DATABASE_URL=postgres://ubuntu:ubuntu@localhost:5432/ubuntu"
    var defQueryCb = function (error, res) {
        if (error) {
            console.log(error.stack);
        }
    };

    var cb = function(error, results) {
        console.log("cb");
        if (results[0]) {
            client.query("INSERT INTO debtless VALUES ('" + results[0][1] +"')", 
                         function(error) {if (error) console.log(error.stack);});
        } 
    };


    client.connect();
    client.query("CREATE TABLE debtless(tag varchar(255))", function(err, res) {
        for (var i = 0; i < symbols.length; i++) {
            var tag = symbols[i];
            async.series([ 
                async.apply(checkDebt, tag)
            ], cb);
        }
    });
}

function main(asyncFunc) {
    scrapeSymbols(); //scrapeSymbols calls filter companies
}


app.get("/stockScraper.js", function (req, res) {
    main();
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
