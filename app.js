const express = require('express');
const app = express();
const handlebars = require('express-handlebars').create({ defaultLayout:'main' });
const fs = require("fs");
const utils = require("./util/util");

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 80);

app.use(express.static(__dirname + '/public'));
app.use(require("body-parser").urlencoded({extended: true}));
app.use(require('./configs/session'));

fs.readFile("./partial/review_petfood_item_partial.handlebars", utils.registerPartial);

const user = require('./routes/user');
const petfood = require('./routes/petfood');
const review = require('./routes/review');
const comment = require('./routes/comment');
const error_handler = require('./middleware/error_handler');

app.use('/user', user);
app.use('/petfood', petfood);
app.use('/review', review);
app.use('/comment', comment);

app.get('/', function(req, res) {
    return res.redirect('/petfood/list/1');
});

app.use(error_handler);

app.listen(app.get('port'), function(){
  console.log( 'Express started on http://localhost:' +
    app.get('port') + '; press Ctrl-C to terminate.' );
});
