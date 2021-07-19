const express = require('express');
const myApp = express();
const port = 4200;

var _packageJson = require('./package.json');

myApp.use(express.static('./dist'));
myApp.get('/*', function(req, res) {
    res.sendFile('index.html', { root: 'dist/' });
});
myApp.listen(process.env.PORT || port);