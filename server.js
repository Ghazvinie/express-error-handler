// Handle uncaught exceptions, keep at top to make sure all are caught.
process.on('uncaughtException', err => {
    console.log(`----- UNCAUGHT EXCEPTION -----\n`)
    console.error(`${err}\n`)
    console.error(`${err.stack}\n`);
    console.log(`----- FORCED SHUTDOWN -----`)
    process.exit(1);
}
);


const express = require('express');
const { GeneralError, MongooseError, ErrorHandler, APIError } = require('./utils/errorClasses');
const mongoose = require('mongoose');

const dotenv = require('dotenv').config();

const Model = mongoose.model('Test', new mongoose.Schema({ someProp: { unique: true, type: Number } }));

const app = express();

app.get('/databaseerror', async (req, res, next) => {
    try {
        // await Model.create({ _id: 'invalid_id' }); // Generates CastError
        // // await Model.create({ someProp: 'invalid_type' }); // Generates validation error
        // // await Model.create({ someProp: 1 }); // Generates duplicate error

        throw (new MongooseError('ValidationError'));  // Artificially generate an error
    } catch (err) {

        next(err);
    }
});

app.get('/apierror', (req, res, next) => {
    try {
        throw (new APIError('Some message')); // Artificially generate an error
    } catch (error) {
        next(error);
    }
});



// Use handleErrors() method to manange errors and create error log
app.use((err, req, res, next) => {
    const errorHandler = new ErrorHandler({ logToFile: true });
    errorHandler.handleErrors(err, res);
});


// Use own error handling
app.use((err, req, res, next) => {
    if (err instanceof MongooseError) {
        res.status(err.httpCode).json({
            message: err.message,
            description: err.description,
            stack: err.stack,
            isOperational: err.isOperational
        });
    }
    if (err instanceof APIError){
        // May choose to send less info if error is of a certain type
        res.status(err.httpCode).json({
            message: err.message,
            description: err.description,
        });
    }
});

const server = app.listen(3000, () => console.log('Server is listening on port 3000...'));
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }, (err) => {
    if (err) throw (err);
    console.log('Connected to DB...');
});




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