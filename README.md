# Express Error Handling

This repository attempts to show one way of handling a few types of error that can occur in an Express app. There are extensive comments throughout the code, it is recommended that these are read as they provide a detailed walkthrough of the error handling process. 

These error handling methods are my own attempts and are used to provide an example only. Error handling is specific to each application in which they occur. I have not worked in a production environment and so therefore these should be taken as my attempt to solidify my learning on the topic. 

### Errors handled:
- Database errors occurring with the Mongoose package
- API errors
- Uncaught exceptions
- Unhandled rejections

### Classes used to achieve precise error management:
- GeneralError, provides generalised error properties and methods from which all specific error classes inherit from
- DatabaseError, errors occurring from use of a database
- APIError, for API errors
- ErrorHandler, for the automatic handling of errors

Classes were used to provide complete control over the error information, and allow them to be tailored to an application's needs. Utility methods were created to aid in the error handling process:
 - Logging the error to a file
 - Logging the error to stderr
 - Auto-generating a suitable error message
 - Auto-handling the error management process and resulting response

### Error management can be achieved in three ways: 
- Passing the original error to next() to be handled by centralised error handling middleware, from here properties can be customised and the client sent a response
- Passing a specific class of error (with customised properties) where it occurs to next(), to be handled by centralised error handling middleware and the client sent a response
- Handling the error where it occurs and as well as sending the client a response

Of the three, the first option is the best method as it allows for the retaining of the most information and increases the modularity and readability of the code. It is suggested that the original error is modified as little as possible and that only relevant and useful supplementary information is added.

### Why handle errors 
 - Handling errors correctly is part of a well functioning application. 
 - Different errors have different levels of severity, an application needs to react accordingly e.g. shutting down, or logging and continuing.
 - When involved with user interaction with the application error handling plays a vital role in communicating information about the user's requests, especially in ensuring data validation. 
 - Monitoring of errors allows for the continual improvement of an application and identifying any performance issues.
 - Not handling errors is a security risk, and managing them correctly allows for the complete control of what information is available and to who. 

### Built with;
- Node.js 14.18.0 / Express 4.17.1
- MongoDB / Mongoose 5.12.12

### To run:

```
$ npm install
```

```
$ npm run start
```

The app is now accessible from localhost:[YOUR_PORT]

You will need to provide your own MongoDB URI in environmental variables (process.env.DB_URI) and set the development environment to production or development (process.env.NODE_ENV).

You can modify the code and/or classes to suit your error handling requirements. 

As it is currently set up a GET request to /databaseerror will log the error to a file, to the console and send the full details to the client. 

### Log files
Some examples of error log files are provided.
