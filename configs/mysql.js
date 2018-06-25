const mysql = require('promise-mysql');
let pool;

if(process.env.NODE_ENV === "production") {
    pool = mysql.createPool({
        host: '10.105.185.181',
        user: 'root',
        database: 'petbuffet',
        password: 'dlrudrms',
        port: '13306',
        connectionLimit: 5
    });
} else {
    pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        database: 'petbuffet',
        password: 'dlrudrms',
        port: '3306',
        connectionLimit: 5
    });
}
module.exports = pool;
