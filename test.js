var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    // database: 'smartfish'
});

connection.connect();
//创建一个数据库
connection.query('CREATE DATABASE IF NOT EXISTS fang DEFAULT CHARSET utf8mb4 ;', function (error, results, fields) {
    if (error) throw error;
    console.log('创建数据库')
    console.log('The solution is: ', results);
});

//选中数据库
connection.query('use fang')

//创建表
connection.query(`CREATE TABLE IF NOT EXISTS user(username char,password char);`, function (error, results, fields) {
    if (error) throw error;
    console.log('创建表')
    console.log('The solution is: ', results);
});

//插入记录
connection.query(`INSERT INTO user(name,age) values('jiang',18);`, function (error, results, fields) {
    if (error) throw error;
    console.log('插入记录')
    console.log('The solution is: ', results);
});

//删除记录
// connection.query(`DELETE FROM user where name = 'jiang';`, function (error, results, fields) {
//     if (error) throw error;
//     console.log('删除记录')
//     console.log('The solution is: ', results);
// });

//修改记录
// connection.query(`UPDATE  user set age = 70 where name = 'jiang';`, function (error, results, fields) {
//     if (error) throw error;
//     console.log('修改记录')
//     console.log('The solution is: ', results);
// });

//查找记录
//选择最近的十个 SELECT name FROM user limit 10
// connection.query(`SELECT name FROM user;`, function (error, results, fields) {
//     if (error) throw error;
//     // console.log('查找记录')
//     // console.log('The solution is: ', results);
//     console.log(typeof results[0].name)
// });

connection.end();