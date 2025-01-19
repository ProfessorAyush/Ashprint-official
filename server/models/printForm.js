const mongoose = require('mongoose');

// Define the schema for PrintForm
const printFormSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  printed: {
    type: Boolean,
    default: false, // Initially set to false
  },
});

// Create a model from the schema
const PrintForm = mongoose.model('PrintForm', printFormSchema);

module.exports = PrintForm;
