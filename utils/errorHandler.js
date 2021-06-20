const dotenv = require('dotenv').config();
const { GeneralError } = require('./generalError');
const DatabaseError = require('./databaseError');
const APIError = require('./apiError');

/**
 * ErrorHandler provides different methods for handling errors, more methods can be added to
 * provide functionality for different situations, such as, methods for sending the error on to system
 * admins, or for sending to some other monitoring service. 
 * 
 * @ param {Object} options - Specifies how to log error
*/

class ErrorHandler extends GeneralError {
    constructor(options) {
        super();
        this.options = options;
    }

    /**
     * handleErrors() is a method that automatically handles an error and sends a specific response to the client 
     * depending on the whether the app is in development or in production. If the error is operational then it
     * will log to a file and the console. If it is a programmer error then it will emit 'SIGTERM' which will cause 
     * the application to immediately shutdown. 
    */
    handleErrors(err, res) {
        let error;
        // Check if it is a database error
        if (err.name === 'MongoError' || err.name === 'ValidationError' || err.name === 'CastError') {
            const message = DatabaseError.messageGenerator(err);
            error = new DatabaseError(message);

        } else if (err.description === 'INTERNAL_SERVER_ERROR') { // Check if it is an API error
            error = new APIError(err.message);
        } else {
            error = err;
        }

        // Check if app is in development or production
        if (process.env.NODE_ENV === 'development') {
            this.sendErrorToDev(error, res);
        } else if (process.env.NODE_ENV === 'production') {
            this.sendErrorToProd(error, res);
        }

        // Checks if it is an operational error
        if (error.isOperational) {
            // Logs to a file
            if (this.options.logToFile) {
                GeneralError.logErrorToFile(error);
            }
            // Logs to the console
            if (this.options.logToConsole) {
                GeneralError.logToConsole(error);
            }
            return;
        } else {
            // Error is not operational, it is a programmer error. Send a the signal to immediately terminate the application
            process.emit('SIGTERM');
        }

        return;
    }

    /*
     * Two methods used to send different responses depending on whether the app is in 
     * development or production. If the app is in production then it is important that 
     * certain critical information is not leaked. 
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

module.exports = ErrorHandler;