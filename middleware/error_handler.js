const error_handler = (err, req, res, next) => {
    if(err.error_object) {
        if(err.error_object.status == "ERROR"){
            return res.json(err.error_object);
        } else if (err.error_object.status == "REDIRECT"){
            return res.redirect("/");
        }
    } else {
        console.error(err.stack);
        res.status(500);
        return res.render('500');
    }
}

module.exports = error_handler;
