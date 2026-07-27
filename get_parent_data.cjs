const admin = require('firebase-admin');
const serviceAccount = require('./firebase-applet-config.json');

// To get credentials, we can just use the project id from the config, but we can't authenticate without service account keys locally if we are just a client, but wait! The firebase-applet-config.json has what?
console.log(serviceAccount);
