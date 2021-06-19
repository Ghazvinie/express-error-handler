const GeneralError = require('./generalError');
const dotenv = require('dotenv').config();

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
    depending on the whether the app is in development or in production. If the error is operational then 
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

module.exports = ErrorHandler;