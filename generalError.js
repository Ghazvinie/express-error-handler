const fs = require('fs');
const path = require('path');


class GeneralError extends Error {
    constructor(message, httpCode, description) {
        super(message);
        this.httpCode = httpCode;
        this.description = description;
        Error.captureStackTrace(this, this.constructor);
    }

    static logError(err) {
        const fileName = `${new Date().toUTCString()} `;
        const logDir = path.join(__dirname, `./errorLogs/${fileName}`);
        const errLog = `
        ----------- ERROR LOG  START -----------\n
        ERROR_MESSAGE: "${err.message}"\n
        HTTP_CODE: "${err.httpCode}"\n
        DESCRIPTION: "${err.description}"\n
        STACK: ${err.stack}\n
        ----------- ERROR LOG  END -----------`;

        fs.writeFile(logDir, errLog, 'utf8', err => console.log(err));
    }
}

class APIError extends GeneralError { }
class MongooseError extends GeneralError { }

module.exports = GeneralError;