const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv').config();

// Utility object for accessing some common http status codes
const commonHttp = {
    OK: 200,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    INTERNAL_SERVER: 500,
};

/*
GeneralError class extends the default Error class. The parameters are used to provide useful
information about the error. For example, isOperational determines whether the error is a runtime 
error, and therefore should be handled differently from a programmer error. 
 */
class GeneralError extends Error {
    constructor(message, httpCode, description, isOperational) {
        super(message);
        this.httpCode = httpCode;
        this.description = description;
        this.isOperational = isOperational;

        // Remove the instance of the class from the stack trace
        Error.captureStackTrace(this, this.constructor);
    }

    /* Method for logging the error to a file. What information to include
    can be customised. 
    */
    static logErrorToFile(err) {
        const fileName = `${new Date().toUTCString()} - ${err.description}`;
        const logDir = path.join(__dirname, `../errorLogs/${fileName}`);
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

    // Simple method for making sure the error is logged to stderr and not stdout.
    static logToConsole(err) {
        console.error(err);
        return;
    }

}

/*
ErrorHandler provides different methods for handling errors, more methods can be added to
provide functionality for different situations. Methods for sending the error on to system
admins or to some other monitoring service.
*/
class ErrorHandler extends GeneralError {
    constructor(options) {
        super();
        this.options = options;
    }

    /* 
    handleErrors() is a method that automatically handles an error and sends a specific response to the client 
    depending on the whether the app is in development or in production. If the error is opertational then 
    it will log to a file and the console. If it is a programmer error then it will emit 'SIGTERM' which will 
    cause the application to immediately shutdown. 
    */
    handleErrors(err, res) {
        let error;
        if (err.name === 'MongoError' || err.name === 'ValidationError' || err.name === 'CastError') {
            const message = MongooseError.messageGenerator(err);
            error = new MongooseError(message);
        }

        if (err.description === 'INTERNAL_SERVER_ERROR') {
            error = new APIError(err.message);
        }

        if (process.env.NODE_ENV === 'development') {
            this.sendErrorToDev(error, res);
        } else if (process.env.NODE_ENV === 'production') {
            this.sendErrorToProd(error, res);
        }

        if (err.isOperational){
            if (this.options.logToFile){
                this.logErrorToFile(error);
            }
            if (this.options.logToConsole){
                error.prototype.logToConsole(error);
            }
            return;
        } else {
            process.emit('SIGTERM');
        }

        return;
    }

    /*
    Two methods used to send different responses depending on whether the app is in 
    development or production. 
    */
    sendErrorToDev(err, res) {
        return res.status(err.httpCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }

    sendErrorToProd(err, res) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }

}

/*
Simple extension of GeneralError with some default paramaters relevant to an APIError.
  */
class APIError extends GeneralError {
    constructor(message, httpCode = commonHttp.INTERNAL_SERVER, description = 'INTERNAL_SERVER_ERROR', isOperational = false) {
        super(message, httpCode, description, isOperational);
    }
}

/* 
MongooseError provides some more sophisticated error handling and management. Default parameters 
are provided along with some methods for automatically generating the customised error message 
based on the type of error. These methods can be used independently if needed. 
*/
class MongooseError extends GeneralError {
    constructor(message, httpCode = commonHttp.BAD_REQUEST, description = 'MONGOOSE_ERROR', isOperational = true) {
        super(message, httpCode, description, isOperational);
    }

    // Depending on the type of error, will automatically select which method of method generation.
    static messageGenerator(err) {
        if (err.name === 'MongoError') {
            return this.duplicateErrorMessage(err);
        }
        if (err.name === 'CastError') {
            return this.castErrorMessage(err);
        }
        if (err.name === 'ValidationError') {
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

module.exports = { GeneralError, APIError, MongooseError, ErrorHandler };