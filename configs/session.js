const session = require('express-session');

const session_info = session({
    key: 'sid', // 세션키
    secret: 'secret', // 비밀키
    cookie: {
      maxAge: 1000 * 60 * 60 // 쿠키 유효기간 1시간
    },
    resave: false,
    saveUninitialized: true
});

module.exports = session_info;
