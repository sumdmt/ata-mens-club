const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  name: String,

  phone: String,

  employee: String,

  service: [String],

  totalDuration: Number,

  date: String,

  time: String,

  endTime: String,

  status: {
    type: String,
    default: "Onay Bekliyor"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model(
  "Appointment",
  appointmentSchema
);