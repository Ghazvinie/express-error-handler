/**
  * Handle uncaught exceptions, keep at top to make sure all are caught.
  * The default error handler could be used in this instance as the eventual
  * outcome is the same - a forced shutdown. This example shows one way of 
  * providing a customised approach of handling this type of exception.
*/

process.on('uncaughtException', err => {
    console.log(` ----- UNCAUGHT EXCEPTION -----\n`);
    console.error(`${err}\n`);
    console.error(`${err.stack}\n`);
    console.log(` ----- FORCED SHUTDOWN -----`);
    process.exit(1);
}
);

const dotenv = require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

// Error classes
const { GeneralError } = require('./utils/generalError');
const ErrorHandler = require('./utils/errorHandler');
const DatabaseError = require('./utils/databaseError');
const APIError = require('./utils/apiError');

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

/**
 * Use this path to generate a few examples of database errors that may occur. These can be
 * created by providing an invalid _id, an invalid type or a duplicate entry, to name a few. 
*/
app.get('/databaseerror', async (req, res, next) => {
    try {
        await Model.create({ _id: 'invalid_id' }); // Generates CastError
        // await Model.create({ someProp: 'invalid_type' }); // Generates validation error
        // await Model.create({ someProp: 1 }); // Generates duplicate error

        // throw (new DatabaseError('ValidationError'));  // Artificially generate an error
    } catch (err) {
        // next(new DatabaseError('ValidationError', 501, 'A Bad Error', true )); // Pass a specific type of error on to error handling middleware
        next(err); // Pass the original error on to be handled by middleware
    }
});

/** 
 * Use this path to generate an example of an API error. The type of error that could occur here will be
 * very specific to each application.
*/

app.get('/apierror', (req, res, next) => {
    try {
        throw (new APIError('AN ERROR')); // Artificially generate an error
    } catch (error) {
        // next(new APIError('AN ERROR')); // Pass a specific type of error on to error handling middleware
        next(error); // Pass the original error on to be handled by middleware
    }
});

/**
* Use handleErrors() method to fully automate error management and eventual response to client.
* Setting logToFile and logToConsole to true will automatically log the error to a file and to the console.
*/

app.use((err, req, res, next) => {
    const errorHandler = new ErrorHandler({ logToFile: true, logToConsole: true });
    errorHandler.handleErrors(err, res);
    return;
});

/**
 * Choose which error information to send on to the client depending on the error type. For example,
 * if it is a DatabaseError then the client can receive more information. If it is an APIError, they
 * can receive less information. 
*/

app.use((err, req, res, next) => {
    if (err instanceof DatabaseError) {
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
        // Decide to log error to console only and not to a file
        GeneralError.logToConsole(err);
    }
});

/**
 * The following two shutdown methods are used to provide an example of how to
 * shutdown the server gracefully (rather than an abrupt stop). They will attempt
 * to stop the server from accepting new connections and to close the database connection.
 * If this fails, after 10 seconds they will force a shutdown. Server connections may be held
 * open by the client, for example, if the request includes "Connection: keep-alive". 
 * 
 * To fully close all connections before shutting down, a store of each new socket connection
 * would need to be kept. This store could then be looped over, deleting/destroying each socket.
*/

// Handle any uncaught rejections
process.on('unhandledRejection', (err, promise) => {
    console.error(`UNHANDLED REJECTION, REASON: ${err.message}\nOCCURED AT:`);
    console.log(promise);
    console.log(' ----- STARTING SHUTDOWN -----');

    // Attempt graceful shutdown
    console.log('Closing server...');
    server.close(() => console.log('server closed'));
    console.log('Closing DB connection...');
    mongoose.disconnect(() => {
        console.log('Disconnected from DB');
        console.log(' ----- SHUTDOWN COMPLETE -----');
        process.exit(1);
    });

    // Force shutdown
    setTimeout(() => {
        console.log(' ----- FORCING SHUTDOWN -----');
        process.exit(1);
    }, 10000);
});

// Shutdown on SIGTERM
process.on('SIGTERM', () => {
    console.log(' ----- SIGTERM RECEIVED -----');
    console.log(' ----- STARTING SHUTDOWN -----');

    // Attempt graceful shutdown
    console.log('Closing server...');
    server.close(() => console.log('server closed'));
    console.log('Closing DB connection...');
    mongoose.disconnect(() => {
        console.log('Disconnected from DB');
        console.log(' ----- SHUTDOWN COMPLETE -----');
        process.exit(1);
    });

    // Force shutdown
    setTimeout(() => {
        console.log(' ----- FORCING SHUTDOWN -----');
        process.exit(1);
    }, 10000);
});