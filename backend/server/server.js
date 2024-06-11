const path = require('path')
const express = require('express')
require('dotenv').config();
const mongoose = require('mongoose')
const db = require('./config/db')

const userInfoRoutes = require("./routes/userInfoRouters");
const authRoutes = require("./routes/authRoutes")
const prayerRoutes = require("./routes/prayerRoutes")
const bodyParser = require('body-parser')
// const mailjet = require('node-mailjet').connect('537601fd90ebd2c3f7ec64efdbe48f94', 'a9f2bb983ab539bd412fbc89a9fcef91');
const Mailjet = require('node-mailjet')

const mailjet = new Mailjet({
   apiKey: '537601fd90ebd2c3f7ec64efdbe48f94',
   apiSecret: 'a9f2bb983ab539bd412fbc89a9fcef91'
})
const cors = require('cors')
const cookieParser = require('cookie-parser')

const Transaction = require('./models/Transaction');

const CURRENT_WORKING_DIR = process.cwd()
const app = express();

mongoose
   .connect(db.mongoURI, db.options)
   .then(() => {
      console.log('connected to MongoDB');
   })
   .catch((error) => {
      console.error('error connecting to MongoDB', error)
   })

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

app.use(express.static(path.join(__dirname, '/build')))
app.use('/uploads', express.static(path.join(CURRENT_WORKING_DIR, '/server/uploads')))

app.use("/api/userInfo", userInfoRoutes);
app.use("/", authRoutes);
app.use("/api/prayer", prayerRoutes);
app.post('/paypal-transaction-complete', async (req, res) => {
   const { orderID, payerID, paymentID } = req.body;
   try {
      const newTransaction = new Transaction({ orderID, payerID, paymentID });
      await newTransaction.save();
      res.json({ message: 'Transaction completed and saved successfully' });
   } catch (error) {
      res.status(500).json({ message: 'Error saving transaction', error });
   }
});

app.post('/send-email', (req, res) => {
   const { fromEmail, fromName, email, name, text } = req.body;

   const emailData = {
      Messages: [
         {
            From: {
               Email: fromEmail,
               Name: fromName
            },
            To: [
               {
                  Email: email,
                  Name: name
               }
            ],
            Subject: "No subject",
            TextPart: text,
         }
      ]
   };

   mailjet
      .post("send", { 'version': 'v3.1' })
      .request(emailData)
      .then((result) => {
         res.status(200).json({ success: true, data: result.body });
      })
      .catch((err) => {
         res.status(500).json({ success: false, error: err.message });
      });
});

app.get('*', (req, res) => {
   res.sendFile(path.join(__dirname, '/build/index.html'))
})

app.listen(db.config.port, () => {
   console.log(`server is running on port`, db.config.port);
})