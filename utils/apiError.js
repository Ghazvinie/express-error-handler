const GeneralError = require('./generalError');

/*
 * Simple extension of GeneralError with some default paramaters relevant to an APIError.
*/
 
class APIError extends GeneralError {
    constructor(message, httpCode = commonHttp.INTERNAL_SERVER, description = 'INTERNAL_SERVER_ERROR', isOperational = false) {
        super(message, httpCode, description, isOperational);
    }
}

module.exports = APIError;