// Handle uncaught exceptions, keep at top to make sure all are caught.
process.on('uncaughtException', err => {
    console.error(
        `----- UNCAUGHT EXCEPTION -----
${err}\n
${err.stack}
----- FORCED SHUTDOWN -----`
    );
    process.exit(1);
});


const express = require('express');
const { GeneralError, MongooseError, ErrorHandler } = require('./utils/errorClasses');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const NODE_ENV = process.env.NODE_ENV

const Model = mongoose.model('Test', new mongoose.Schema({ someProp: { unique: true, type: Number }, someProp1: { unique: true, type: Number }, someProp2: { unique: true, type: Number } }));

const app = express();

app.get('/', async (req, res, next) => {

    try {
        await Model.create({ _id: 12 });
    } catch (err) {
        next(err);
    }
});


app.use((err, req, res, next) => {
    // if (err.name === 'MongoError' || err.name === 'ValidationError' || err.name === 'CastError') {
    //     const message = MongooseError.messageGenerator(err);
    //     const error = new MongooseError(message);
    // }
    const errorHandler = new ErrorHandler({ logToFile: true });
    errorHandler.handleErrors(err, req, res, next);
    // ErrorHandler.handleErrors(err, req, res, next);
});

const server = app.listen(3000, () => console.log('Server is listening on port 3000...'));
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }, () => console.log('Connected to DB...'));



// Handle any uncaught rejections
process.on('unhandledRejection', (err, promise) => {
    console.error(`UNHANDLED REJECTION, REASON: ${err.message}\nOCCURED AT:`);
    console.log(promise);
    console.error(' ----- STARTING SHUTDOWN -----');
    // Attempt graceful shutdown
    mongoose.disconnect(async () => {
        console.log('Disconnected from DB...');
        await server.close(() => console.log('Server disconnected...'));
        console.log('----- SHUTDOWN COMPLETE -----');
        process.exit(1);
    });

    // Force shutdown
    setTimeout(() => {
        console.log('FORCING SHUTDOWN');
        process.exit(1);
    }, 10000);
});