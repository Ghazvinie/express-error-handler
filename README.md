# Express Error Handling

This repository attempts to show one way of handling a few types of error that can occur in an Express app. There are exentensive comments throughout the code, therefore it is suggested that these are read to gain more detailed and specific information. 

These error handling methods are my own attempts and are used to provide an example only. Error handling is specific to each app in which they occur. 

### Error examples used:
- Database errors occurring with the Mongoose package
- API errors
- Uncaught exceptions
- Unhandled rejections

### Classes were used to achieve precise error management:
- GeneralError, provides generalised error properties and methods from which all specific error classes inherit from.
- MongooseError, for database errors
- APIError, for API Errors
- ErrorHandler, for the customised handling of all errors. 

### Error management can be achieved in three ways: 
- Passing each error to next() and having centralised error handling middleware. From here it can be customised to a precise format and the client sent a response.
- Throwing a specific class of error where it occurs for handling in middleware and then sending a response. 
- Handling the error where it occurs and then sending a response.

### 
