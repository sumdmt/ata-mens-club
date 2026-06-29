const axios = require("axios");

const sendSMS = async (phone, message) => {
  try {
    if (process.env.SMS_ENABLED !== "true") {
      console.log("SMS sistemi kapalı.");
      console.log("Telefon:", phone);
      console.log("Mesaj:", message);
      return;
    }

    await axios.post(
      process.env.SMS_API_URL,
      {
        phone,
        message,
        sender: process.env.SMS_SENDER,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SMS_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("SMS gönderildi:", phone);
  } catch (error) {
    console.error("SMS gönderme hatası:", error.message);
  }
};

module.exports = { sendSMS };