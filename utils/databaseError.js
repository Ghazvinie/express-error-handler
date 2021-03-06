const { GeneralError, commonHttp } = require('./generalError');

/*
 * DatabaseError provides more sophisticated error handling and management. Default parameters 
 * are provided along with some methods for automatically generating the customised error message 
 * based on the type of error. These methods can be used independently if needed. 
*/

class DatabaseError extends GeneralError {
    constructor(message, httpCode = commonHttp.BAD_REQUEST, description = 'DATABASE_ERROR', isOperational = true) {
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

    /**
     * These methods return a different message depending on the type of error, each containing
     * information relevant to that error type. 
     */

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

module.exports = DatabaseError;