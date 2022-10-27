const mqtt = () => {
    const mqtt = require('mqtt')
    const host = 'broker.emqx.io'
    const mqttPort = '1883'
    const clientId = `mqtt_${Math.random().toString(16).slice(3)}`
    const connectUrl = `mqtt://${host}:${mqttPort}`
    const client = mqtt.connect(connectUrl, {
        clientId,
        clean: true,
        connectTimeout: 4000,
        username: 'emqx',
        password: 'public',
        reconnectPeriod: 1000,
    })
    const topic = '15/data/temp'
    //mqtt连接
    client.on('connect', () => {
        console.log('Connected')
        client.subscribe([topic], () => {
            console.log(`Subscribe to topic '${topic}'`)
        })
    })
    //mqtt接受消息
    client.on('message', (topic, payload) => {
        console.log('Received Message:', topic, payload.toString())
    })
    //发布消息
    client.on('connect', () => {
        client.publish(topic, 'nodejs mqtt test', { qos: 0, retain: false }, (error) => {
            if (error) {
                console.error(error)
            }
        })
    })
}

module.exports = mqtt