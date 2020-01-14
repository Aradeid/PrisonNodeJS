/* global $ */

var http = require('http');
var path = require('path');
var express = require('express');
var exphbs = require('express-handlebars');

var app = express();
var server = http.createServer(app);

// body parser declarations
var bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var fs = require("fs");

// database declarations
var low = require('lowdb');
var FileSync = require('lowdb/adapters/FileSync');
var adapter = new FileSync('json/database.json');
var db = low(adapter);
db.defaults({ submissions: [], guards: [], prisoners: [] }).write();

// express handlebars setup
app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    fixLineBreakers : function(text) {
      text = text.replace(/(\r\n|\n|\r)/gm, '<br>');
      return text;
    },
    shorten : function(text) {
      return text.slice(0, 99).replace(/(\r\n|\n|\r)/gm, '<br>') + "...";
    },
    makeTitle : function(title) {
      if (title == undefined || title.length == 0) {
        return "Prisson - " + GetRandomFlavortext();
      } else {
        return title + " | Prisson - " + GetRandomFlavortext();
      }
    }
  }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, '/public')));
app.use('/static', express.static(path.join(__dirname, '/public')));
var messages = [];
var sockets = [];

// POST and GET routes
app.get('/($|home|blog|articles|index)', function(req, res) {
  var pageNr;
  if (req.query.page) {
    pageNr = req.query.page;
  } else {
    pageNr = 1; 
  }
  var articles = require("./json/articles.json");
  if (articles.length - pageNr * 10 >= -8) {
    var counterModifier = 0;
    if (articles.length - pageNr * 10  < 1) {
      counterModifier = 10 - ((articles.length - 1) % 10);
    }
  } else {
    return res.redirect('/404');
  }
  res.render('home', {
    home: true,
    pageNr: pageNr,
    totalPages: Math.ceil((articles.length - 1) / 10),
    headlines: articles.slice().reverse().slice(10 * (pageNr - 1), 10 * pageNr - counterModifier)
  });
});

app.get('/articles/new', function(req, res) {
  res.render('newArticle', {
    home: true,
    title: "Write a new article for the blog"
  });
});

app.post('/article', function(req, res) {
  var articles = require("./json/articles.json");
  var article = {
    "id" : articles.length,
    "date" : Math.floor(Date.now() / 1000),
    "title" : req.body.title,
    "content" : req.body.content
  };
  
  articles.push(article);
  
  fs.writeFile('./json/articles.json', JSON.stringify(articles, null, "\t"), 'utf8');
  
  res.redirect('/articles');
});

app.get('/articles/:id', function(req, res) {
  var articles = require("./json/articles.json");
  if (req.params.id < articles.length) {
    var article = articles[req.params.id];
  
    res.render('article', {
      home: true,
      title: article.title,
      headerTitle: article.title,
      content: article.content,
      timePosted: toHumanTime(article.date),
      timePassed: timeElapsed(article.date)
    });
  } else {
    res.redirect('/articles/0');
  }
});

app.get('/about', function(req, res) {
  res.render('about', {
    about: true,
    title: 'Why us?',
  });
});

app.get('/team', function(req, res) {
  var ranks = db.get('guards').map('title').value();
  var uniqueRanks = [];
  ranks.forEach(function(el){
    if(uniqueRanks.indexOf(el) == -1) uniqueRanks.push(el);
  });
  var personell = [];
  uniqueRanks.forEach(function(el){
    var rank = {
      name: el + 's',
      members: db.get('guards').filter({title: el}).value()
    };
    personell.push(rank);
  });
  res.render('team', {
    team: true,
    title: 'Our amazing team',
    personell: personell
  });
});

app.get('/guards/:id', function(req, res) {
  if (req.params.id < db.get('guards').size().value()) {
    var guard = db.get('guards').find({ id: Number(req.params.id) }).value();
  
    res.render('guard', {
      team: true,
      firstName: guard.firstName,
      lastName: guard.lastName,
      guardTitle: guard.title,
      service: timeElapsed(guard.service),
      imgPath: guard.imagePath
    });
  } else {
    res.redirect('/400');
  }
});

app.get('/clients', function(req, res) {
  res.render('clients', {
    title: 'Our beloved clients',
    clients: db.get('prisoners').value()
  });
});

app.get('/clients/:id', function(req, res) {
  if (req.params.id < db.get('prisoners').size().value()) {
    var prisoner = db.get('prisoners').find({ id: Number(req.params.id) }).value();
  
    res.render('client', {
      firstName: prisoner.firstName,
      lastName: prisoner.lastName,
      alias: prisoner.alias,
      service: timeElapsed(prisoner.start),
      end: toHumanTime(Number(prisoner.start) + Number(prisoner.service)),
      imgPath: prisoner.imagePath
    });
  } else {
    res.redirect('/400');
  }
});

app.get('/register', function(req, res) {
  res.render('register', {
    register: true,
    title: 'Apply to our wonderful prison today',
  });
});

app.post('/register', function(req, res) {
  var fname = req.body.firstName;
  var lname = req.body.lastName;
  var email = req.body.email;
  var felony = req.body.felony;
  if (!db.get('submissions').find({ email: email }).value()) { // verify introduced email with the database
    db.get('submissions').push({ email: email, firstName: fname, lastName: lname, felony: felony, registrationTime: Math.floor(Date.now() / 1000)}).write();
    res.redirect('/register/success');
  } else {
    res.redirect('/register/failure?reason=EmailExists');
  }
});

app.get('/register/success', function(req, res) {
  res.render('form-success', {
    register: true,
    title: 'YESS',
  });
});

app.get('/register/failure', function(req, res) {
  var reason;
  switch (req.query.reason) {
    case 'EmailExists':
      reason = "This email has already been registered. Please wait patiently until we reply. It can take up to 2 weeks."
      break;
    default:
      reason = "Please contact us on phone and describe how you got to this point."
  }
  res.render('form-failure', {
    register: true,
    title: 'Failure',
    reason: reason,
  });
});

app.get('/add/prisoner', function(req, res)  {
  res.render('newPrisoner', {
    team: true,
    title: 'Register a new prisoner'
  });
});

app.get('/add/guard', function(req, res)  {
  res.render('newGuard', {
    team: true,
    title: 'Register a new guard'
  });
});

app.post('/add/prisoner', function(req, res) {
  var fname = req.body.firstName;
  var lname = req.body.lastName;
  var alias = req.body.alias;
  var service = req.body.serviceDuration;
  var start = req.body.serviceStart;
  var imgPath = req.body.image;
  db.get('prisoners').push({ id: db.get('prisoners').size().value(), firstName: fname, lastName: lname, alias: alias, service: (Number(service) * 31556926), start: start, imagePath: imgPath}).write();
  
  res.redirect('/add/prisoner');
});
//console.log(db.get('submissions').size().val());
app.post('/add/guard', function(req, res) {
  var fname = req.body.firstName;
  var lname = req.body.lastName;
  var title = req.body.title;
  var service = req.body.serviceDuration;
  var imgPath = req.body.image;
  db.get('guards').push({ id: db.get('guards').size().value(), firstName: fname, lastName: lname, title: title, service: Math.floor(Date.now() / 1000 - (Number(service) * 31556926)), imagePath: imgPath}).write();
  
  res.redirect('/add/guard');
});

app.get('/404', function(req, res) {
  res.render('clientError');
});

app.get('/500', function(req, res) {
  res.render('serverError');
});

// always keep this route last, to avoid false redirects
app.get('/*', function(req, res) {
    res.redirect('/404');
});

server = app.listen(8080, function(){
  var addr = server.address().address;
  var port = server.address().port;
  console.log("Server listening at", addr + ":" + port);
});

app.use(function(err, req, res, next) {
  // log the error, for now just console.log
  console.log(err);
  res.redirect('/500');
});

function timeElapsed(time) {
  var diff = Math.ceil((new Date()).getTime() / 1000 - time);
  var divider;
  var unit;
  switch (true) {
    case (diff>31556926):
      divider = 31556926;
      unit = 'years';
      break;
    case (diff>2629743):
      divider = 2629743;
      unit = 'months';
      break;
    case (diff>604800):
      divider = 604800;
      unit = 'weeks';
      break;
    case (diff>86400):
      divider = 86400;
      unit = 'days';
      break;
    case (diff>3600):
      divider = 3600;
      unit = 'hours';
      break;
    case (diff>60):
      divider = 60;
      unit = 'minutes';
      break;
    default:
      divider = 1;
      unit = 'seconds';
  }
  
  return Math.floor(diff / divider).toString() + ' ' + unit;
}

function toHumanTime(time){
  var a = new Date(time * 1000);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var day = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var humanTime = day + '-' + month + '-' + year + ' ' + hour + ':' + min + ':' + sec ;
  return humanTime;
}

function GetRandomFlavortext() {
  var text = [
    "The accent is on the 'o'",
    "The best place to waste the rest of your life in",
    "If you are getting locked in for life, get locked in with style",
    "It is not as expensive as you may think",
    "Apply now using the link below, or by calling us directly",
    "Don't rot away in a mediocre prison, rot away with us",
    "Being locked is much more fun with us",
    "The only prison that truly cares about its inmates",
    "Hurry up, before we run out of places",
    "Register once, change your life forever"
  ];
  return text[Math.floor(Math.random() * text.length)];
}