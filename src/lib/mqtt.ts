import mqtt from 'mqtt';
import { v4 as uuidv4 } from 'uuid';

// MQTT Configuration
const MQTT_BROKER = '167.71.237.218';
const MQTT_PORT = 8083;
const MQTT_PROTOCOL = window.location.protocol === 'https:' ? 'wss' : 'ws';
const MQTT_PATH = '/mqtt'; // Explicitly define the path

interface MqttMessage {
  msgId: string;
  identifier: string;
  outParams: Record<string, any>;
}

export const sendToyUpdate = async (serialNumber: string, roleType: string, language: string, voice: string) => {
  const clientId = `cheeko_web_${uuidv4()}`;
  const connectUrl = `${MQTT_PROTOCOL}://${MQTT_BROKER}:${MQTT_PORT}${MQTT_PATH}`;

  const client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: 'admin', // Add default EMQX credentials if needed
    password: 'public',
    reconnectPeriod: 1000,
    protocol: 'ws',
    path: MQTT_PATH,
    rejectUnauthorized: false
  });

  // Add connection logging
  client.on('connecting', () => {
    console.log('Connecting to MQTT broker...');
  });

  return new Promise((resolve, reject) => {
    const connectionTimeout = setTimeout(() => {
      client.end();
      reject(new Error('Connection timeout - MQTT broker unreachable'));
    }, 30000);

    client.on('connect', () => {
      clearTimeout(connectionTimeout);
      console.log('Connected to MQTT broker');

      const message: MqttMessage = {
        msgId: uuidv4(),
        identifier: 'updaterole',
        outParams: {
          roleType,
          language,
          voice
        }
      };

      const topic = `user/cheekotoy/${serialNumber}/thing/data/post`;
      
      // Add a flag to track if we've handled the completion
      let isCompleted = false;

      client.publish(topic, JSON.stringify(message), { qos: 1 }, (error) => {
        if (isCompleted) return; // Prevent multiple resolves/rejects
        isCompleted = true;

        // Gracefully end the client connection
        client.end(false, () => {
          if (error) {
            console.error('MQTT publish error:', error);
            reject(new Error(`Failed to publish message: ${error.message}`));
          } else {
            console.log('Message published successfully');
            resolve(true);
          }
        });
      });
    });

    client.on('error', (error) => {
      clearTimeout(connectionTimeout);
      console.error('MQTT client error:', error);
      client.end();
      reject(new Error(`MQTT connection error: ${error.message}`));
    });

    client.on('close', () => {
      console.log('MQTT connection closed');
    });

    client.on('offline', () => {
      console.log('MQTT client is offline');
    });
  });
};