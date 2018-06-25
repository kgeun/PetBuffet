const image_url = (req, res, next) => {
    let data = req.data;
    if(process.env.NODE_ENV === "production"){
        data.image_url = "10.105.185.181:8080";
    } else {
        data.image_url = "localhost:8080";
    }
    return next();
}

module.exports = image_url;
