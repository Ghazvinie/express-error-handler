const express = require('express');
const GeneralError = require('./generalError');

const app = express();

GeneralError.logError({message: 'message', httpCode: 500, description: 'description'});


app.listen(3000, (err) => {
    if (err) console.log('Server failed to listen');
    console.log('Server listening on port 3000');
});