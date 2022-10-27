var mqtt = require('./mqtt.js')
var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    // database: 'smartfish'
});

if (!port) {
    console.log('请指定端口号 如\nnode server.js 8888')
    process.exit(1)
}
//mqtt
// mqtt()



connection.query('CREATE DATABASE IF NOT EXISTS fang DEFAULT CHARSET utf8mb4 ;', function (error, results, fields) {
    if (error) throw error;
});

//选中数据库
connection.query('use fang')

//创建表
connection.query(`CREATE TABLE IF NOT EXISTS user(username VARCHAR(100),password VARCHAR(100));`, function (error, results, fields) {
    if (error) throw error;
});

//axios
var server = http.createServer(function (request, response) {
    var parsedUrl = url.parse(request.url, true)
    var pathWithQuery = request.url
    var queryString = ''
    if (pathWithQuery.indexOf('?') >= 0) { queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
    var path = parsedUrl.pathname
    var query = parsedUrl.query
    var method = request.method

    /******** 从这里开始看，上面不要看 ************/

    console.log('有个人发请求过来啦！路径（带查询参数）为：' + pathWithQuery)


    if (path == '/register' && method == 'POST') {
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.setHeader('Access-Control-Allow-Origin', 'http://10.149.3.126:3000')
        let array = []
        request.on('data', (chunk) => {
            array.push(chunk)
        })
        request.on('end', () => {
            const string = Buffer.concat(array).toString()
            const obj = JSON.parse(string)
            const username = `"${obj.username}"`
            const password = `"${obj.password}"`
            response.end('很好')
            connection.connect();
            //创建一个数据库

            //  插入记录
            connection.query(`INSERT INTO user(username,password) VALUES(${username},${password});`, function (error, results, fields) {
                if (error) throw error;
            });
        })
    }
    if (path == '/history' && method == 'POST') {
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.setHeader('Access-Control-Allow-Origin', 'http://10.149.3.126:3000')
        let res
        //选中数据库
        connection.query('use smartfish')
        //查找记录
        // 选择最近的十个 SELECT name FROM user limit 10
        connection.query(`SELECT * FROM smartfishtable;`, function (error, results, fields) {
            if (error) throw error;
            res = JSON.parse(JSON.stringify(results))
            response.writeHead(200, { 'Content-type': 'text/html;charset=utf-8' });
            response.write(JSON.stringify(res));
            response.end()

        });
    }
    else {
        response.statusCode = 200
        // 默认首页
        const filePath = path === '/' ? '/index.html' : path
        const index = filePath.lastIndexOf('.')
        const suffix = filePath.substring(index)
        const fileTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.png': 'image/png',
            '.jpg': 'image/jpeg'
        }
        response.setHeader('Content-Type', `${fileTypes[suffix] || 'text/html'};charset=utf-8`)

        let content
        try {
            content = fs.readFileSync(`./public/${filePath}`)

        } catch (error) {
            content = '文件不存在'
            response.statusCode = 404
        }
        response.write(content)
        response.end()
    }


    /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n http://localhost:' + port)