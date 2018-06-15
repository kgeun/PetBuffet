const middleAuth = (req, res, next) => {
    var data = {};
    if(req.session.userid) {
        data.session = req.session;
    }
    req.data = data;
    return next();
}

module.exports = middleAuth;
