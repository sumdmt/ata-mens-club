const mongoose = require("mongoose");

const blockedSlotSchema = new mongoose.Schema(
  {
    employee: {
      type: String,
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
      default: "Kapalı saat",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "BlockedSlot",
  blockedSlotSchema
);