require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Appointment = require("./Appointment");
const BlockedSlot = require("./BlockedSlot");

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB bağlandı"))
  .catch((err) => console.log("MongoDB bağlantı hatası:", err.message));

const timeToMinutes = (time) => {
  if (!time) return 0;

  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

app.get("/", (req, res) => {
  res.send("ATA MEN'S CLUB Backend Çalışıyor");
});

app.post("/api/appointments", async (req, res) => {
  try {
    const {
  name,
  phone,
  employee,
  service,
  totalDuration,
  totalPrice,
  date,
  time,
  endTime,
} = req.body;

    if (
      !name ||
      !phone ||
      !employee ||
      !service ||
      !date ||
      !time ||
      !totalDuration
    ) {
      return res.status(400).json({
        message: "Eksik randevu bilgisi gönderildi.",
      });
    }

    const appointments = await Appointment.find({
      employee,
      date,
    });

    const blockedSlots = await BlockedSlot.find({
      employee,
      date,
    });

    const newStart = timeToMinutes(time);
    const newEnd = newStart + Number(totalDuration);

    const appointmentConflict = appointments.find((item) => {
      const existingStart = timeToMinutes(item.time);
      const existingEnd = existingStart + Number(item.totalDuration || 0);

      return newStart < existingEnd && newEnd > existingStart;
    });

    if (appointmentConflict) {
      return res.status(400).json({
        message: "Bu saat aralığı dolu.",
      });
    }

    const blockedConflict = blockedSlots.find((slot) => {
      const blockedStart = timeToMinutes(slot.startTime);
      const blockedEnd = timeToMinutes(slot.endTime);

      return newStart < blockedEnd && newEnd > blockedStart;
    });

    if (blockedConflict) {
      return res.status(400).json({
        message: "Bu saat aralığı kapalı.",
      });
    }

    const appointment = await Appointment.create({
  name,
  phone,
  employee,
  service,
  totalDuration,
  totalPrice,
  date,
  time,
  endTime,
});

    res.status(201).json({
      message: "Randevu başarıyla kaydedildi.",
      appointment,
    });
  } catch (error) {
    console.log("Randevu kayıt hatası:", error.message);

    res.status(500).json({
      message: "Randevu kaydedilirken hata oluştu.",
      error: error.message,
    });
  }
});

app.get("/api/appointments", async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({
      createdAt: -1,
    });

    res.json(appointments);
  } catch (error) {
    console.log("Randevular alınamadı hata detayı:", error.message);

    res.status(500).json({
      message: "Randevular alınamadı.",
      error: error.message,
    });
  }
});

app.post("/api/blocked-slots", async (req, res) => {
  try {
    const { employee, date, startTime, endTime, reason } = req.body;

    if (!employee || !date || !startTime || !endTime) {
      return res.status(400).json({
        message: "Eksik kapalı saat bilgisi gönderildi.",
      });
    }

    const blockedSlot = await BlockedSlot.create({
      employee,
      date,
      startTime,
      endTime,
      reason: reason || "Kapalı saat",
    });

    res.status(201).json({
      message: "Kapalı saat başarıyla eklendi.",
      blockedSlot,
    });
  } catch (error) {
    console.log("Kapalı saat ekleme hatası:", error.message);

    res.status(500).json({
      message: "Kapalı saat eklenirken hata oluştu.",
      error: error.message,
    });
  }
});

app.get("/api/blocked-slots", async (req, res) => {
  try {
    const blockedSlots = await BlockedSlot.find().sort({
      createdAt: -1,
    });

    res.json(blockedSlots);
  } catch (error) {
    console.log("Kapalı saat listeleme hatası:", error.message);

    res.status(500).json({
      message: "Kapalı saatler alınamadı.",
      error: error.message,
    });
  }
});

app.delete("/api/blocked-slots/:id", async (req, res) => {
  try {
    const deletedBlockedSlot = await BlockedSlot.findByIdAndDelete(
      req.params.id
    );

    if (!deletedBlockedSlot) {
      return res.status(404).json({
        message: "Kapalı saat bulunamadı.",
      });
    }

    res.json({
      message: "Kapalı saat başarıyla silindi.",
    });
  } catch (error) {
    console.log("Kapalı saat silme hatası:", error.message);

    res.status(500).json({
      message: "Kapalı saat silinirken hata oluştu.",
      error: error.message,
    });
  }
});

app.delete("/api/appointments/:id", async (req, res) => {
  try {
    const deletedAppointment = await Appointment.findByIdAndDelete(
      req.params.id
    );

    if (!deletedAppointment) {
      return res.status(404).json({
        message: "Randevu bulunamadı.",
      });
    }

    res.json({
      message: "Randevu başarıyla silindi.",
    });
  } catch (error) {
    console.log("Randevu silme hatası:", error.message);

    res.status(500).json({
      message: "Randevu silinirken hata oluştu.",
      error: error.message,
    });
  }
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server çalışıyor: ${PORT}`);
});