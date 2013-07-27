  var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    path = require('path'),
    mongo = require('mongodb'),
    mongoose = require('mongoose'),
    fs = require('fs'),
    lazy = require("lazy");


  var collection = "data";
  mongoose.connect('mongodb://209.129.244.25/pronunciation');

  server.listen(9000);
  app.use("/", express.static(__dirname + '/'));
  app.use("/js", express.static(__dirname + '/js'));
  app.use("/img", express.static(__dirname + '/img'));

  // app.use(express.static(path.join(__dirname, 'public')));
  app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
  });


  var db = mongoose.connection;

  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function() {
    console.log("mongoDB connected");
    // getTranscript();
  });

  var scheme = mongoose.Schema({
    WORD: String,
    PRON: String
  });
  var items = mongoose.model('items', scheme, collection);

  function getTranscript() {
    new lazy(fs.createReadStream('data.txt')).lines.forEach(function(line) {
      var split = line.toString().split('\t');
      var object = {
        WORD: split[0],
        PRON: split[1]
      }
      addToDB(object);
    });
    console.log('DONE!');
  }

  function addToDB(object) {
    var data = new items(object);
    data.save(function(error, data) {
      if (error) {
        console.log(error);
      } else {
        console.log('success');
      }
    });
  }
  function updateDB(id, edit){
    var conditions = {
      _id: id
    }
    var changes = {
      PRON: edit
    }
    items.update(conditions, {$set: changes}, {upsert:true}, function(error){});
  }
  function deleteDB(id){
    var conditions = {
      _id: id
    }
    items.remove(conditions,function(error){});
  }

  function queryWord(word, cb) {
    var conditions = {
      WORD: {
        $in: word
      }
    }
    items.find(conditions, function(err, res) {
      cb(res);
    });
  }

  io.sockets.on('connection', function(socket) {
    //Return most dangerous place in the world
    socket.on('queryWord', function(word) {
      queryWord(word, function(res) {
        socket.emit('getPron', res, word);
      });
    });
    socket.on('addWord', function(object) {
      addToDB(object);
      socket.emit('refresh');
    });
    socket.on('updateWord', function(id, edit){
      updateDB(id, edit);
    });
    socket.on('deleteWord', function(id, edit){
    console.log(id);
      deleteDB(id);
    });
  });