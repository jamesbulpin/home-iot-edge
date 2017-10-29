'use strict';

var mqtt = require('mqtt');
var config = require('/home/pi/.iothub.json');

module.exports = {
  broker: null,
  configuration: null,

  create: function (broker, configuration) {
    console.log("Creating local MQTT connection...");
    this.broker = broker;
    this.configuration = configuration;

    this.client = mqtt.connect(config.localmqtt.url, JSON.parse(config.localmqtt.protocol));
    this.client.on('connect', this.home_mqtt_on_connect.bind(this));
    
    return true;
  },

  start: function () {
    setInterval(function () {}, 500); // Workaround to avoid long waits for MQTT processing
    this.broker.publish({
      properties: {
        'source': 'mapping',
        'deviceFunction': 'register',
        'deviceName': config.iothub.deviceName,
        'deviceKey': config.iothub.deviceKey
      },
      content: new Uint8Array(Buffer.from(" ", 'utf8'))
    });
  },

  receive: function(message) {
    var m = Buffer.from(message.content).toString();
    console.log("inbound", m);
    var x = JSON.parse(m);
    if (("topic" in x) && ("message" in x)) {
      console.log("publish", x.topic, x.message);
      this.client.publish(x.topic, x.message, null, this.home_mqtt_callback_publish.bind(this));
    }
  },

  destroy: function() {
    console.log('sensor.destroy');
  },

  home_mqtt_on_connect: function() {
    console.log("Home MQTT connected.");
    this.client.on('message', this.home_mqtt_receive.bind(this));
    this.client.on('offline', this.home_mqtt_offline.bind(this));
    this.client.on('error', this.home_mqtt_error.bind(this));
    this.client.on('close', this.home_mqtt_close.bind(this));
    this.client.on('reconnect', this.home_mqtt_reconnect.bind(this));
    this.client.subscribe('Alert/#');
    this.client.subscribe('Azure/#');
  },
  
  home_mqtt_offline: function() {
    console.log("Home MQTT offline.");
  },

  home_mqtt_error: function(err) {
    console.log("Home MQTT error:", err);
  },

  home_mqtt_close: function() {
    console.log("Home MQTT close.");
  },

  home_mqtt_reconnect: function() {
    console.log("Home MQTT reconnect.");
  },

  home_mqtt_callback_publish: function(err) {
    if (err) {
      console.log("Home MQTT publish error:", err);
    }
    else {
      console.log("Home MQTT publish OK");
    }
  },
  
  home_mqtt_receive: function(topic, message) {
    console.log("MQTT:", topic, message.toString());
    var messageContent = {
        'topic':topic,
        'message':message.toString()
    };
    this.broker.publish({
      properties: {
        'source': 'mapping',
        'deviceName': config.iothub.deviceName,
        'deviceKey': config.iothub.deviceKey,
        'route': 'home'
      },
      content: new Uint8Array(Buffer.from(JSON.stringify(messageContent), 'utf8'))
    });
  }
};
