
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

//Mongoose connecting
//---------------------------------------------
var mongoose = require('mongoose');
mongoose.connect("localhost");
mongoose.connection.on('error', function() {
  console.error('✗ MongoDB Connection Error. Please make sure MongoDB is running.');
});

//FAYE
//---------------------------------------------
var faye = require('faye');
var bayeux = new faye.NodeAdapter({
	mount: "/faye",
	timeout: 45
});

var app = express();

// all environments
//---------------------------------------------
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
//---------------------------------------------
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// routes
//---------------------------------------------
app.get('/', routes.index);				//TODO Create new instance when they come  (check PaintStream for example)
//app.get('/:id', routes.instance);		//TODO Go to instance, add them to mongodb (check PaintStream for example)
//app.get('/message', routes.message);
app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});