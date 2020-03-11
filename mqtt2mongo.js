'use strict'

const mqtt = require('mqtt');
const mongodb = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const { createLogger, format, transports } = require('winston');
const config = require('./config.js').parse();

let justStarted = true;

// Initate the logger
const logger = createLogger({
    level: config.loglevel,
    format: format.combine(
      format.colorize(),
      format.splat(),
      format.simple(),
    ),
    transports: [new transports.Console()]
});


        



const setMqttHandlers = function(mqttClient, mongoCollection) {
    

    mqttClient.on('close', function () {
        logger.info('MQTT disconnected');
    });

    mqttClient.on('reconnect', function () {
        logger.info('MQTT trying to reconnect');
    });

    mqttClient.on('message', function (topic, message, packet) {
        // ignore the initial retained messages
        if (!packet.retain)  {
            // message is a buffer
            logger.silly("MQTT received %s : %s", topic, message)
            var json = {};
            try {
                json = JSON.parse(String(message));
            } catch (e) {
                // ignore
            }
            var messageObject = {
                ts: new Date(),
                topic: topic,
                message: message.toString(),
                json: json
            };
            mongoCollection.insertOne(messageObject, function(error, result) {
                if (error != null) {
                    logger.error(error);
                }
                logger.silly("MONGO inserted %s : %s", topic, message)
            });
        } else {
            logger.silly("MQTT ignored initial retained  %s : %s", topic, message)
        }
    });

}


// connect to MQTT
let mqttClient = mqtt.connect(config.mqtt.url, config.mqtt.options);
mqttClient.on('connect', function () {
    logger.info('MQTT connected');
    for (const topic of config.topics) {
        mqttClient.subscribe(topic);
        logger.verbose('subscribed to %s', topic);
    }
});

// connect to MongoDB
let mongoUri = 'mongodb://' + config.mongodb.hostname + ':' + config.mongodb.port;
const mongoClient = new MongoClient(mongoUri, {useUnifiedTopology: true});

mongoClient.connect(function(err) {
    if (err != null) {
        throw err;
    }
    console.info("Connected successfully to MongoDB server");
  
    const database = mongoClient.db(config.mongodb.database);
    const collection = database.collection(config.mongodb.collection);
    collection.createIndex({ "ts": -1 });
    collection.createIndex({ "topic": 1 });

    // now that we are connected to Mongo, start handling MQTT messages
    setMqttHandlers(mqttClient, collection);
  
    //mongoClient.close();
});




    

    





