/*jshint node: true */

var express = require('express');
var app = express();
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
app.set('port', (process.env.PORT || 5000));
var companies = [];

// ccb = compcallback

function filterCompanies(ccb) { //CHANGE THIS TO NOT BE BASED OFF OF ASYNC.FILTER
    var ret = [];   
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
                if ((comp["Total Debt"] == "N/A" && comp["Total Debt/Equity"] == "N/A") || (parseFloat(comp["Total Debt/Equity"]) < 20)) {
                    ret.push(comp);
                }
                callback(null, true);

            } else {
                console.log('error');
            }
        });
    }, function(error, results) {
        ccb(error, ret);
    });
         
}

function scrapeSymbols(ccb) { //will have initiate which reads from json and scrape which will read from nasdaq or w/e
    /*var tempCompanies = [{tag:"ALP^Q"}, {tag:"NBY"}];
    console.log("finished inti");
    ccb(null, tempCompanies);*/
    var ret =[];
    var tempTag;
    console.log("scrape symbols called");
    request("http://www.nasdaq.com/screening/companies-by-region.aspx?region=North+America&pagesize=10000", function(error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);
            
            $("h3").each(function(counter, h3) {
                tempTag = $("a", h3).text().trim();
                ret.push({tag:tempTag});
            });
        }
        ccb(error, ret);
        filterCompanies(ccb);
    });
    
}

function main() {
    scrapeSymbols(compCallback); //scrapeSymbols calls filter companies
}

function compCallback(error, newCompanies) { // only sets companies as new companies if no error
    if (error) {
        return true;
    } else {
        companies = newCompanies;
        console.log(companies);
    }
}

app.get("/stockScraper.js", function (req, res) {
    main();
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
