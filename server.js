// const mqtt = require('./mqtt.js')
var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
});
// ---------------------------------------------------   DATABASE   -----------------------------------------------
//连接
connection.connect();
//创建数据库
connection.query('CREATE DATABASE IF NOT EXISTS fang DEFAULT CHARSET utf8mb4 ;', function (error, results, fields) {
    if (error) throw error;
});

//选中数据库
connection.query('use smartfish')

//创建表
connection.query(`CREATE TABLE IF NOT EXISTS user(username VARCHAR(100),password VARCHAR(100));`, function (error, results, fields) {
    if (error) throw error;
});
// ---------------------------------------------------   DATABASE   -----------------------------------------------

// -----------------------------------------------------  mqtt --------------------------------------------------
const mqtt = require('mqtt')
const host = 'broker.emqx.io'
const mqttPort = '1883'
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`
const connectUrl = `mqtt://${host}:${mqttPort}`
const topic = '15/data/temp'
const client = mqtt.connect(connectUrl, {
    clientId,
    clean: false,
    connectTimeout: 4000,
    username: 'emqx',
    password: 'public',
    reconnectPeriod: 1000,
})

const mqttConnect = (callback) => {
    const client = mqtt.connect(connectUrl, {
        clientId,
        clean: false,
        connectTimeout: 4000,
        username: 'emqx',
        password: 'public',
        reconnectPeriod: 1000,
    })
    client.once('error', () => {
        // console.log(error)
        //如果出错 就重连

    })

    client.once('connect', () => {
        connect = true
        console.log(client.connected)
        callback()
        client.subscribe([topic], () => {
            console.log(`Subscribe to topic '${topic}'`)
        })
    })
    client.on('message', (topic, payload) => {
        localData = JSON.parse(payload.toString())
        console.log('1')
        console.log(localData)
        const light = localData.light
        const pump = localData.pump
        const temp = localData.temp
        const ZDValue = localData.ZDValue
        const feed = localData.servo
        connection.query(`INSERT INTO smartfishtable(temp,light,pump,quality,feed,time) VALUES(${temp},${light},${pump},${ZDValue},${feed},CURTIME() );`, function (error, results, fields) {
            if (error) throw error;
        });
    })
    //消除retain属性消息
    // client.publish('15/data/temp', "", { qos: 2, retain: true }, (error) => {
    //     if (error) {
    //         console.error(error)
    //     }
    // })
}
// -----------------------------------------------------  mqtt --------------------------------------------------


if (!port) {
    console.log('请指定端口号 如\nnode server.js 8888')
    process.exit(1)
}


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

    // console.log('有个人发请求过来啦！路径（带查询参数）为：' + pathWithQuery)
    let mqttContent = []
    //拿取数据库的最新一条数据
    if (path == '/data' && method == 'POST') {
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.setHeader('Access-Control-Allow-Origin', '*')
        let newData
        connection.query(`SELECT * FROM smartfishtable  ORDER BY id desc limit 1`, function (error, results, fields) {
            if (error) throw error;
            newData = JSON.parse(JSON.stringify(results))
            response.writeHead(200, { 'Content-type': 'text/html;charset=utf-8' });
            response.write(JSON.stringify(newData));
            response.end()
            return
        });
        return
    }
    //echart数据请求
    if (path == '/echartData' && method == 'POST') {
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.setHeader('Access-Control-Allow-Origin', '*')
        let newData
        connection.query(`SELECT temp,time,quality FROM smartfishtable  ORDER BY id desc limit 5`, function (error, results, fields) {
            if (error) throw error;
            newData = JSON.parse(JSON.stringify(results))
            response.writeHead(200, { 'Content-type': 'text/html;charset=utf-8' });
            response.write(JSON.stringify(newData));
            response.end()
            return
        });

        return
    }
    if (path == '/select' && method == 'POST') {
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.setHeader('Access-Control-Allow-Origin', '*')
        let select = []
        request.on('data', (chunk) => {
            select.push(chunk)
        })
        request.on('end', () => {
            const selectObj = JSON.parse(Buffer.concat(select).toString())
            const selectItem = selectObj.input.toString()
            connection.query(`SELECT ${selectItem},time FROM smartfishtable ORDER BY id desc limit 50`, function (error, results, fields) {
                if (error) throw error;
                console.log(results)
                res = JSON.parse(JSON.stringify(results))
                response.writeHead(200, { 'Content-type': 'text/html;charset=utf-8' });
                response.write(JSON.stringify(res));
                response.end()
                return
            });
        })
        return
    }
    //灯带请求
    if (path == '/light' && method == 'POST') {
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.setHeader('Access-Control-Allow-Origin', '*')
        request.on('data', (chunk) => {
            mqttContent.push(chunk)
        })
        request.on('end', () => {
            const mqttContentObj = JSON.parse(Buffer.concat(mqttContent).toString())
            console.log(mqttContentObj)
            const light = mqttContentObj.light.toString()
            const pump = mqttContentObj.pump.toString()
            connection.query(`INSERT INTO smartfishtable(light,pump,time) VALUES(${light},${pump},CURTIME() );`, function (error, results, fields) {
                if (error) throw error;
            });
            client.publish('15/data/light', light, { qos: 2, retain: true }, (error) => {
                if (error) {
                    console.error(error)
                }
            })
            mqttContent = []
        })
        return
    }
    //水泵
    if (path == '/pump' && method == 'POST') {
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.setHeader('Access-Control-Allow-Origin', '*')
        request.on('data', (chunk) => {
            mqttContent.push(chunk)
        })
        request.on('end', () => {
            const mqttContentObj = JSON.parse(Buffer.concat(mqttContent).toString())
            const light = mqttContentObj.light.toString()
            const pump = mqttContentObj.pump.toString()
            connection.query(`INSERT INTO smartfishtable(light,pump,time) VALUES(${light},${pump},CURTIME());`, function (error, results, fields) {
                if (error) throw error;
            });
            client.publish('15/data/pump', pump, { qos: 2, retain: true }, (error) => {
                if (error) {
                    console.error(error)
                }
            })

            mqttContent = []
        })
        return
    }
    //注册请求
    if (path == '/register' && method == 'POST') {
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.setHeader('Access-Control-Allow-Origin', '*')
        let array = []
        request.on('data', (chunk) => {
            array.push(chunk)
        })
        request.on('end', () => {
            const string = Buffer.concat(array).toString()
            const obj = JSON.parse(string)
            const username = `"${obj.username}"`
            const password = `"${obj.password}"`
            //  插入记录
            connection.query(`INSERT INTO user(username,password) VALUES(${username},${password});`, function (error, results, fields) {
                if (error) throw error;
            });
        })
        return
    }
    //mqtt请求
    if (path == '/mqtt') {
        mqttConnect(() => {
            console.log('mqtt已连接')
            response.statusCode = 200
            response.setHeader('Content-Type', 'text/html;charset=utf-8')
            response.setHeader('Access-Control-Allow-Origin', '*')
            response.write('connected')
            response.end()
            return
        })
        return
    }
    //历史记录请求
    if (path == '/history' && method == 'POST') {
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.setHeader('Access-Control-Allow-Origin', '*')
        let res
        //选中数据库
        connection.query('use smartfish')
        //查找记录
        connection.query(`SELECT * FROM smartfishtable  ORDER BY id desc limit 100`, function (error, results, fields) {
            if (error) throw error;
            res = JSON.parse(JSON.stringify(results))
            response.writeHead(200, { 'Content-type': 'text/html;charset=utf-8' });
            response.write(JSON.stringify(res));
            response.end()
            return

        });
        return
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