require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Appointment = require("./Appointment");

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB bağlandı"))
  .catch((err) => console.log("MongoDB bağlantı hatası:", err));

const timeToMinutes = (time) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

app.get("/", (req, res) => {
  res.send("ATA MEN'S CLUB Backend Çalışıyor");
});

app.post("/api/appointments", async (req, res) => {
  try {
    const { employee, date, time, totalDuration } = req.body;

    const appointments = await Appointment.find({
      employee,
      date
    });

    const newStart = timeToMinutes(time);
    const newEnd = newStart + Number(totalDuration);

    const conflict = appointments.find((item) => {
      const existingStart = timeToMinutes(item.time);
      const existingEnd =
        existingStart + Number(item.totalDuration || 0);

      return newStart < existingEnd && newEnd > existingStart;
    });

    if (conflict) {
      return res.status(400).json({
        message: "Bu saat aralığı dolu."
      });
    }

    const appointment = await Appointment.create(req.body);

    res.json({
      message: "Randevu başarıyla kaydedildi",
      appointment
    });
  } catch (error) {
    res.status(500).json({
      message: "Randevu kaydedilirken hata oluştu."
    });
  }
});

app.get("/api/appointments", async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({
      createdAt: -1
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({
      message: "Randevular alınamadı."
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server çalışıyor: ${PORT}`);
});