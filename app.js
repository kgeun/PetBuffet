const express = require('express');
const app = express();
const handlebars = require('express-handlebars')
.create({ defaultLayout:'main' });
const hbs = require('handlebars');
const session = require('express-session');
const redis = require("redis");
const fs = require("fs");
const redisStore = require("connect-redis")(session);
//const helper = require('./helper');

fs.readFile("./partial/review_petfood_item_partial.handlebars", function (err, data) {
        if (err) throw err;
        hbs.registerPartial('review_petfood_item', data.toString())
});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 80);

app.use(express.static(__dirname + '/public'));
app.use(require("body-parser").urlencoded({extended: true}));

//var redisClient = redis.createClient(6379, 'localhost');

app.use(session({
    key: 'sid', // 세션키
    secret: 'secret', // 비밀키
    cookie: {
      maxAge: 1000 * 60 * 60 // 쿠키 유효기간 1시간
    }
}));

app.get('/', function(req, res) {
    return res.redirect('/petfood/list/1');
});

const user = require('./routes/user')
const petfood = require('./routes/petfood')
const review = require('./routes/review')

app.use('/user', user)
app.use('/petfood', petfood)
app.use('/review', review)

// 404 catch-all handler (middleware)
app.use(function(req, res, next){
    res.status(404);
    return res.render('404');
});

// 500 error handler (middleware)
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500);
    return res.render('500');
});

app.listen(app.get('port'), function(){
  console.log( 'Express started on http://localhost:' +
    app.get('port') + '; press Ctrl-C to terminate.' );
});
