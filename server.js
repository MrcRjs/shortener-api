'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var shortid = require('shortid');
var logger = require('morgan');
var dns = require('dns');
var Schema = mongoose.Schema;

var cors = require('cors');

var app = express();

const shortUrlSchema = {
  url: String,
  shorturl: { type: String, index: { unique: true }}
}


var ShortURL = mongoose.model('ShortURL', shortUrlSchema);

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI,{ useMongoClient: true });

app.use(cors());
app.use(logger('tiny'));

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/api/shorturl/:id", function(req, res) {
  ShortURL.findOne({shorturl: req.params.id}, function(err, foundurl) {
    if(err) {
      console.log(err);
      res.send(500, "Error retrieving url");
    } else {
      if( foundurl) {
        res.redirect(301, foundurl.url);
      } else {
        res.send(404, "Url Not found");
      }
    }
  });
});


app.post("/api/shorturl/new", function(req, res) {
  dns.lookup(req.body.url, function(err) {
    if(!err) {
      const shorturl = shortid.generate();
      const newUrl = new ShortURL({ url: req.body.url, shorturl});
      newUrl.save(function(err, savedurl) {
        if(!err) {
          res.json({"original_url": req.body.url, "short_url": shorturl });
        }
        else {
          console.log(err);
          res.send(500, "Error saving url");
        }
      });
    } else {
      res.json({"error":"invalid URL"});
    }
  });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});