const yaml = require('js-yaml');
const fs   = require('fs');

exports.parse = function () {
    const file = process.env.MQTT2MONGO_CONFIG || 'config.yaml';
    if (fs.existsSync(file)) {
        try {
          return yaml.safeLoad(fs.readFileSync(file, 'utf8'));
        } catch (e) {
          console.log(e);
          process.exit();
        }
    } else {
        return {
            loglevel: 'silly',
            mongodb: {
                hostname: 'localhost',
                port: 27017,
                database: 'mqtt2mongo',
                collection: 'message'
            },
            mqtt: {
                url: 'mqtt://localhost'
            },
            topics: [ "#" ]
        }
    }
}