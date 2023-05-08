const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const myRoute = require('./routes/myRoute.js')
const port = process.env.port || 3000;

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());

app.use('/', myRoute);

app.listen(port, function () {
    console.log(`App listening at ${port}`);
});
