const fs = require('fs');
const path = require('path');

// Utility object for accessing some common http status codes
const commonHttp = {
    OK: 200,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    INTERNAL_SERVER: 500,
};

/**
 * GeneralError class extends the default Error class. The parameters are used to provide useful
 * information about the error. For example, isOperational determines whether the error is a runtime 
 * error, and therefore should be handled differently from a programmer error.
 * 
 * @ param {String} message - An error message
 * @ param {Number} httpCode - HTTP status code
 * @ param {String} description - Extra information about the error
 * @ param {Boolean} isOperational - Operational or programmer error
 * 
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

    /** 
     * Method for logging the error to a file. What information to include
     * can be formatted to suit different requirements. The file is saved to 
     * a directory with a filename constructed from the current date and time, 
     * along with the error description.
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

module.exports = { GeneralError, commonHttp };