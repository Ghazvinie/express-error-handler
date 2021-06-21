const { GeneralError, commonHttp } = require('./generalError');

/*
 * Simple extension of GeneralError with some default parameters relevant to an APIError.
*/

class APIError extends GeneralError {
  constructor(message, httpCode = commonHttp.INTERNAL_SERVER, description = 'INTERNAL_SERVER_ERROR', isOperational = true) {
    super(message, httpCode, description, isOperational);
  }
}

module.exports = APIError;