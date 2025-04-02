const express = require('express');
const mqtt = require('mqtt');
const path = require('path');
const util = require('util');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
// Create variables for MQTT use here
const MQTT_BROKER = 'mqtt://localhost';
const TOPIC = 'Miro';

app.use(bodyParser.json());
function read(filePath = './message.json') {
    return readFile(path.resolve(__dirname, filePath)).then(data => JSON.parse(data));
}
function write(data, filePath = './message.json') {
    return writeFile(path.resolve(__dirname, filePath), JSON.stringify(data));
}

// create an MQTT instance
const mqttClient = mqtt.connect(MQTT_BROKER);
// Check that you are connected to MQTT and subscribe to a topic (connect event)
mqttClient.on('connect', ()=>{
    console.log('MQTT Connected!');
    mqttClient.subscribe(TOPIC, err => {
        if(!err){
            console.log(`Successfully subscribed to ${TOPIC}!`);
        }
    });


})
// handle instance where MQTT will not connect (error event)
mqttClient.on('error', err => {
    console.log(`Error connecting! (${err})`);
})

// Handle when a subscribed message comes in (message event)
mqttClient.on(`message`, async (topic, msg) => {
    console.log(`received message on ${topic}.`, `Message: ${msg.toString()}`);
    try {
        const messages = await read();
        const newMessage = {
            id: Date.now().toString(),
            topic: topic,
            msg: msg.toString(),
            timestamp: new Date().toISOString()
        };
        messages.push(newMessage);
        await write(messages);

        mqttClient.publish(newMessage.topic, newMessage.msg);

    }catch(err){
        console.log(err);
    }

})

// Route to serve the home page
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, `./index.html`));
})

// route to serve the JSON array from the file message.json when requested from the home page
app.get('/messages', async (req, res) => {
    try {
        const messages = await read();
        res.json(messages);
    } catch (err) {
        console.log(err);
    }
})

// Route to serve the page to add a message
app.get('/add', (req, res) => {
    res.sendFile(path.resolve(__dirname, `./message.html`));
})

//Route to show a selected message. Note, it will only show the message as text. No html needed

app.get('/:id', async (req, res) => {
    try {
        const messages = await read();
        const message = messages.find(x => x.id === req.params.id);
        if (!message) {
            return res.status(404).send('Not found');
        }
        res.send(message);
    } catch (err){
        console.log(err);
    }
})
// Route to CREATE a new message on the server and publish to mqtt broker
app.post('/',async (req, res) => {
    const {id, topic, msg} = req.body;
    mqttClient.publish(topic || TOPIC, msg);
    try {
        let messages = await read();
        messages.push({id, topic, msg});
        await write(messages);
        res.sendStatus(200);


    }catch(err){
        console.log(err);
    }
})

// Route to delete a message by id (Already done for you)

app.delete('/:id', async (req, res) => {
    try {
        const messages = await read();
        write(messages.filter(c => c.id !== req.params.id));
        res.sendStatus(200);
    } catch (e) {
        res.sendStatus(200);
    }
});

// listen to the port
app.listen(3001, '0.0.0.0', () => {});