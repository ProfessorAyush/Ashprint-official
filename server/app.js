const express = require("express");
const cors = require("cors");
const multer = require("multer");
const bodyParser = require("body-parser");
const fs = require("fs");
const { PDFDocument } = require("pdf-lib");
const Razorpay = require("razorpay");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Razorpay configuration
const razorpay = new Razorpay({
  key_id: "rzp_test_unOC8OTfw4EaD3", // Replace with your Razorpay Key ID
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Middleware
app.use(cors({
  origin: '*', // Allow only your frontend to make requests
  methods: ['GET', 'POST'], // Allow only GET and POST requests
  allowedHeaders: ['Content-Type'], // Allow specific headers
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Multer setup for file uploads
const upload = multer({ dest: "uploads/" });

// Define schema and model for storing print form data
const printFormSchema = new mongoose.Schema({
  name: { type: String, required: true },
  filePath: { type: String, required: true },
  printColor: { type: String, required: true },
  copies: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  orderId: { type: String, required: true }, // Razorpay order ID
  printed: { type: Boolean, default: false },
});


const PrintForm = mongoose.model("PrintForm", printFormSchema);

// Helper function to calculate page count from PDF
const getPageCount = async (filePath) => {
  try {
    const pdfData = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfData);
    return pdfDoc.getPageCount();
  } catch (err) {
    console.error("Error reading PDF:", err);
    return 0;
  }
};

// Route to handle file upload and get page count
app.post("/upload", upload.single("file"), async (req, res) => {
  const file = req.file;

  if (!file || !file.originalname.endsWith(".pdf")) {
    return res.status(400).json({ error: "Only PDF files are allowed." });
  }

  try {
    const pageCount = await getPageCount(file.path);
    res.json({ pageCount, filePath: file.path }); // Return file path along with page count
  } catch (error) {
    res.status(500).json({ error: "Error processing the PDF file." });
  }
});

// Route to create a Razorpay order
// Route to create a Razorpay order
app.post("/create-order", async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount." });
  }

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    // Send back the order ID to the client
    res.json({ order_id: order.id });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
});

// Updated route to store order details in MongoDB
app.post("/create-order-details", async (req, res) => {
  const { name, filePath, printColor, copies, totalPrice, orderId } = req.body;

  // Validate incoming data
  if (!name || !filePath || !printColor || !copies || !totalPrice || !orderId) {
    return res.status(400).json({ error: "All fields, including orderId, are required." });
  }

  try {
    // Create a new PrintForm document with the Razorpay order ID
    const newOrder = new PrintForm({
      name,
      filePath,
      printColor,
      copies,
      totalPrice,
      orderId, // Save the Razorpay order ID in the database
    });

    // Save the order to MongoDB
    await newOrder.save();
    res.status(201).json({ message: "Order created successfully", data: newOrder });
  } catch (error) {
    console.error("Error creating order in database:", error);
    res.status(500).json({ error: "Failed to save order details." });
  }
});


// Endpoint to verify payment
app.post("/verify-payment", async (req, res) => {
  const { paymentId, orderId } = req.body;

  const options = {
    payment_id: paymentId,
    order_id: orderId,
  };

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    if (payment.status === "captured") {
      // If the payment is successful, return success
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Payment not successful" });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: "Failed to verify payment." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
