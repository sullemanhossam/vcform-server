require('dotenv').config()

import { Resend } from 'resend';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import fastcsv from 'fast-csv';


const resend = new Resend('re_123456789');
const app = express();

// we would like that the contacts are stored as a csv

// Here we would like that the admin is notified of any new entries


const PORT = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());


const csvFilePath = path.join(__dirname, 'data.csv'); // Define your CSV file path

app.use(express.json()); // To parse JSON request bodies

// POST route to append fields to the CSV
app.post('/append-csv', (req, res) => {
    const data = req.body;

    // Validate input data
    if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).send('Invalid data format. Please provide an array of objects.');
    }

    // Ensure the CSV file exists, and if not, create it with headers
    const headers = Object.keys(data[0]);
    const fileExists = fs.existsSync(csvFilePath);

    try {
        if (!fileExists) {
            // Create the file and write headers if it doesn't exist
            const writeStream = fs.createWriteStream(csvFilePath);
            const csvWriteStream = fastcsv.format({ headers: true });
            csvWriteStream.pipe(writeStream);
            csvWriteStream.write(data[0]); // Write first row to initialize headers
            csvWriteStream.end();
        }

        // Append rows to the CSV file
        const csvWriteStream = fastcsv.format({ headers: false });
        const writeStream = fs.createWriteStream(csvFilePath, { flags: 'a' });

        csvWriteStream.pipe(writeStream);
        data.forEach((row) => csvWriteStream.write(row));
        csvWriteStream.end();

        res.status(200).send('Data successfully appended to CSV.');
    } catch (error) {
        console.error('Error while appending data to CSV:', error);
        res.status(500).send('Error while appending data to CSV.');
    }
});

// GET route to download the CSV file
app.get('/download-csv', (req, res) => {
    if (!fs.existsSync(csvFilePath)) {
        return res.status(404).send('No CSV file found');
    }

    res.download(csvFilePath, 'contacts.csv');
});

app.get('/', async (req: Request, res: Response) => {
  try {
    const data = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: ['delivered@resend.dev'],
      subject: 'Hello World',
      html: '<strong>it works!</strong>',
    });

    res.status(200).json(data);
  } catch(error) {
    res.status(400).json(error);
  }
})

app.listen(PORT, () => {
  if (!process.env.RESEND_API_KEY) {
    throw `Abort: You need to define RESEND_API_KEY in the .env file.`;
  }

  console.log('Listening on http://localhost:3000');
});
