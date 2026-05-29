const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    employee: {
      type: String,
      required: true,
    },

    service: {
      type: [String],
      required: true,
    },

    totalDuration: {
      type: Number,
      required: true,
    },

    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    date: {
      type: String,
      required: true,
    },

    time: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Appointment", appointmentSchema);