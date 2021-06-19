const fs = require('fs');
const path = require('path');

class GeneralError extends Error {
    constructor(message, httpCode, description, isOperational) {
        super(message);
        this.httpCode = httpCode;
        this.description = description;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }

    logErrorToFile(err) {
        const fileName = `${new Date().toUTCString()} - ${err.description}`;
        const logDir = path.join(__dirname, `./errorLogs/${fileName}`);
        const errLog = `
        ----------- ERROR LOG START -----------\n
        ERROR_MESSAGE: "${err.message}"\n
        HTTP_CODE: "${err.httpCode}"\n
        DESCRIPTION: "${err.description}"\n
        STACK: ${err.stack}\n
        ----------- ERROR LOG END -----------`;
        fs.writeFile(logDir, errLog, 'utf8', err => console.log(err));
        return;
    }

    logToConsole(err) {
        console.error(err);
        return;
    }

}

const commonHttp = {
    OK: 200,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    INTERNAL_SERVER: 500,
};

class APIError extends GeneralError {
    constructor(message, httpCode = commonHttp.INTERNAL_SERVER, description = 'INTERNAL_SERVER_ERROR', isOperational = true) {
        super(message, httpCode, description, isOperational, originalError);
    }
}

class MongooseError extends GeneralError {
    constructor(message, httpCode = commonHttp.BAD_REQUEST, description = 'MONGOOSE_ERROR', isOperational = true) {
        super(message, httpCode, description, isOperational);
    }

    static messageGenerator(err){
        if (err.name === 'MongoError'){
            return this.duplicateErrorMessage(err);
        }
        if (err.name === 'CastError'){
            return this.castErrorMessage(err);
        }
        if (err.name === 'ValidationError'){
            return this.validationErrorMessage(err);
        }
    }

    static castErrorMessage(err) {
        const message = `Invalid ${err.path}: ${err.value}`;
        return message;
    }

     static duplicateErrorMessage(err) {
        const key = Object.keys(err.keyValue);
        const value = Object.values(err.keyValue);
        const message = `Property: ${key} has a duplicate field: ${value}. Please use another value.`;
        return message;
    }

    static validationErrorMessage(err) {
        const errors = Object.values(err.errors).map(individualError => individualError.message);
        const message = `Invalid data input: ${errors.join('\n')}`;
        return message;
    }
}

module.exports = { GeneralError, MongooseError };