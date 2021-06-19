/* 
Handle uncaught exceptions, keep at top to make sure all are caught.
Could just use default error handling for this, this example is used 
to provide an example of a custom method.
*/
process.on('uncaughtException', err => {
    console.log(`----- UNCAUGHT EXCEPTION -----\n`);
    console.error(`${err}\n`)
    console.error(`${err.stack}\n`);
    console.log(`----- FORCED SHUTDOWN -----`);
    process.exit(1);
}
);

const dotenv = require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { GeneralError, MongooseError, ErrorHandler, APIError } = require('./utils/errorClasses');

// Create a basic data structure to test some database errors
const Model = mongoose.model('error', new mongoose.Schema({ someProp: { unique: true, type: Number } }));

// Express app
const app = express();

// Create server and connect to database
const server = app.listen(3000, () => console.log('Server is listening on port 3000...'));
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }, (err) => {
    if (err) throw (err);
    console.log('Connected to DB...');
});

/*
Use this path to generate a few examples of database errors that may occur. These can be
created by providing an invalid _id, an invalid type or a duplicate entry, to name a few. 
*/
app.get('/databaseerror', async (req, res, next) => {
    try {
        await Model.create({ _id: 'invalid_id' }); // Generates CastError
        // await Model.create({ someProp: 'invalid_type' }); // Generates validation error
        // await Model.create({ someProp: 1 }); // Generates duplicate error

        // throw (new MongooseError('ValidationError'));  // Artificially generate an error
    } catch (err) {
        next(new MongooseError('ValidationError')); // Can pass the desired error on to error handling middleware
        next(err); // Pass the error on to middleware to be customised at a later stage
    }
});

/*
Use this path to generate an example of an API error. 
*/
app.get('/apierror', (req, res, next) => {
    try {
        throw (new APIError('Some message')); // Artificially generate an error
    } catch (error) {
        next(new APIError('ValidationError')); // Can pass the desired error on to error handling middleware
        next(error);
    }
});

/* Use handleErrors() method to fully automate error management and eventual response to client.
Setting logToFile and logToConsole to will automatically log the error to a file and to the console.
*/
app.use((err, req, res, next) => {
    const errorHandler = new ErrorHandler({ logToFile: true, logToConsole: true });
    ErrorHandler.handleErrors(err, res);
});

/*
Choose which error information to send on to the client depending on the error type. For example,
if it is a MongooseError then the client can receive more information. If it is an APIError, they
can receive less information. 
*/
app.use((err, req, res, next) => {

    if (err instanceof MongooseError) {
        res.status(err.httpCode).json({
            message: err.message,
            description: err.description,
            stack: err.stack,
            isOperational: err.isOperational
        });
        // Decide to log error to file
        GeneralError.logErrorToFile(err);

    }
    if (err instanceof APIError) {
        res.status(err.httpCode).json({
            message: err.message,
            description: err.description,
        });
        // Decide to log error to console only and not a file
        GeneralError.logErrorToConsole(err);
    }
});

/*
The following two shutdown methods are used to provide an example of how to
shutdown the server gracefully (rather than an abrupt stop). They will attempt
to stop the server from accepting new connections and to close the database connection.
If this fails, after 10 seconds they will force a shutdown. Server connections may be held
open depending on the client, for example, if the request includes "Connection: keep-alive".
*/

// Handle any uncaught rejections
process.on('unhandledRejection', (err, promise) => {
    console.error(`UNHANDLED REJECTION, REASON: ${err.message}\nOCCURED AT:`);
    console.log(promise);
    console.log(' ----- STARTING SHUTDOWN -----');

    // Attempt graceful shutdown
    mongoose.disconnect(async () => {
        console.log('Disconnected from DB...');
        server.close(() => console.log('Server disconnected...'));
        console.log('----- SHUTDOWN COMPLETE -----');
        process.exit(1);
    });

    // Force shutdown
    setTimeout(() => {
        console.log('FORCING SHUTDOWN');
        process.exit(1);
    }, 10000);
});

// Shutdown on SIGTERM
process.on('SIGTERM', () => {
    console.log(' ----- STARTING SHUTDOWN -----');

    // Attempt graceful shutdown
    console.log('Closing server...');
    server.close(() => console.log('server closed'));

    console.log('Closing DB connection...');
    mongoose.disconnect(() => {
        console.log('Disconnected from DB...');
        process.exit(1);
    });

    // Force shutdown
    setTimeout(() => {
        console.log('----- FORCED SHUTDOWN -----');
        process.exit(1);
    }, 10000);
});