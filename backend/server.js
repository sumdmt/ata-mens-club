require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Appointment = require("./Appointment");
const BlockedSlot = require("./BlockedSlot");
const { createClient } = require("redis");
const { RedisStore } = require("rate-limit-redis");
const { sendSMS } = require("./services/smsService");
const cron = require("node-cron");

const app = express();

const calculateMoneyFields = (employee, totalPrice) => {
  const priceNumber = Number(totalPrice || 0);

  let rentShare = 0;

  if (employee !== "Bilal Ata") {
    rentShare = priceNumber / 2;
  }

  const employeeEarning = priceNumber - rentShare;

  return { rentShare, employeeEarning };
};

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://redis:6379",
});

redisClient.on("error", (err) => {
  console.error("Redis bağlantı hatası:", err);
});

redisClient.connect().then(() => {
  console.log("Redis bağlantısı başarılı");
});

const limiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.",
});

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors());
app.use(limiter);
app.use(express.json({ limit: "10kb" }));

const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Yetkisiz erişim. Token bulunamadı.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        message: "Bu işlem için yetkiniz yok.",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Geçersiz veya süresi dolmuş token.",
    });
  }
};

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB bağlandı"))
  .catch((err) => console.log("MongoDB bağlantı hatası:", err.message));

const timeToMinutes = (time) => {
  if (!time) return 0;

  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

const getTodayString = () => new Date().toISOString().split("T")[0];

const deletePastBlockedSlots = async () => {
  const today = getTodayString();

  await BlockedSlot.deleteMany({
    date: { $lt: today },
  });
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

    const { rentShare, employeeEarning } = calculateMoneyFields(
      employee,
      totalPrice
    );

    const appointments = await Appointment.find({ employee, date });
    const blockedSlots = await BlockedSlot.find({ employee, date });

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
      status: "pending",
      rentShare,
      employeeEarning,
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

app.post("/api/admin/appointments", verifyAdminToken, async (req, res) => {
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
      !totalDuration ||
      !totalPrice
    ) {
      return res.status(400).json({
        message: "Eksik randevu bilgisi gönderildi.",
      });
    }

    const appointments = await Appointment.find({ employee, date });
    const blockedSlots = await BlockedSlot.find({ employee, date });

    const newStart = timeToMinutes(time);
    const newEnd = newStart + Number(totalDuration);

    const appointmentConflict = appointments.find((item) => {
      const existingStart = timeToMinutes(item.time);
      const existingEnd = existingStart + Number(item.totalDuration || 0);

      return newStart < existingEnd && newEnd > existingStart;
    });

    if (appointmentConflict) {
      return res.status(400).json({
        message: "Bu saat aralığında başka bir randevu var.",
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

    const { rentShare, employeeEarning } = calculateMoneyFields(
      employee,
      totalPrice
    );

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
      status: "approved",
      rentShare,
      employeeEarning,
    });

    const serviceText = Array.isArray(service) ? service.join(", ") : service;

    const message = `Sayin ${name}, ATA MEN'S CLUB randevunuz olusturuldu ve onaylandi. Tarih: ${date}, Saat: ${time}, Islem: ${serviceText}.`;

    await sendSMS(phone, message);

    res.status(201).json({
      message: "Admin tarafından randevu oluşturuldu.",
      appointment,
    });
  } catch (error) {
    console.log("Admin randevu oluşturma hatası:", error.message);

    res.status(500).json({
      message: "Admin randevusu oluşturulurken hata oluştu.",
      error: error.message,
    });
  }
});

app.get("/api/appointments", async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({
      date: 1,
      time: 1,
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

app.put(
  "/api/appointments/update-old-money-fields",
  verifyAdminToken,
  async (req, res) => {
    try {
      const appointments = await Appointment.find();

      let updatedCount = 0;

      for (const appointment of appointments) {
        const { rentShare, employeeEarning } = calculateMoneyFields(
          appointment.employee,
          appointment.totalPrice
        );

        appointment.rentShare = rentShare;
        appointment.employeeEarning = employeeEarning;

        await appointment.save();

        updatedCount++;
      }

      res.json({
        message: "Eski randevular güncellendi.",
        updatedCount,
      });
    } catch (error) {
      res.status(500).json({
        message: "Eski randevular güncellenemedi.",
        error: error.message,
      });
    }
  }
);

app.put("/api/appointments/:id/status", verifyAdminToken, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Geçersiz durum.",
      });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (appointment && status === "approved") {
      const serviceText = Array.isArray(appointment.service)
        ? appointment.service.join(", ")
        : appointment.service;

      const message = `Sayin ${appointment.name}, ATA MEN'S CLUB randevunuz onaylandi. Tarih: ${appointment.date}, Saat: ${appointment.time}, Islem: ${serviceText}.`;

      await sendSMS(appointment.phone, message);
    }

    if (!appointment) {
      return res.status(404).json({
        message: "Randevu bulunamadı.",
      });
    }

    res.json({
      message: "Durum güncellendi.",
      appointment,
    });
  } catch (error) {
    console.log("Durum güncelleme hatası:", error.message);

    res.status(500).json({
      message: "Durum güncellenemedi.",
      error: error.message,
    });
  }
});

app.put("/api/appointments/:id", verifyAdminToken, async (req, res) => {
  try {
    const {
      name,
      phone,
      employee,
      service,
      totalDuration,
      price,
      date,
      time,
      endTime,
      status,
    } = req.body;

    if (!employee || !date || !time || !totalDuration) {
      return res.status(400).json({
        message: "Eksik randevu güncelleme bilgisi gönderildi.",
      });
    }

    const appointments = await Appointment.find({
      employee,
      date,
      _id: { $ne: req.params.id },
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
        message: "Bu saat aralığında başka bir randevu var.",
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

    const { rentShare, employeeEarning } = calculateMoneyFields(
      employee,
      price
    );

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        name,
        phone,
        employee,
        service,
        totalDuration,
        price: Number(price),
        totalPrice: Number(price),
        rentShare,
        employeeEarning,
        date,
        time,
        endTime,
        status,
      },
      { new: true }
    );

    if (!updatedAppointment) {
      return res.status(404).json({
        message: "Randevu bulunamadı.",
      });
    }

    res.json({
      message: "Randevu başarıyla güncellendi.",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.log("Randevu güncelleme hatası:", error.message);

    res.status(500).json({
      message: "Randevu güncellenirken hata oluştu.",
      error: error.message,
    });
  }
});

app.post("/api/blocked-slots", verifyAdminToken, async (req, res) => {
  try {
    const { employee, date, startTime, endTime, reason } = req.body;

    if (!employee || !date || !startTime || !endTime) {
      return res.status(400).json({
        message: "Eksik kapalı saat bilgisi gönderildi.",
      });
    }

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      return res.status(400).json({
        message: "Bitiş saati başlangıç saatinden sonra olmalıdır.",
      });
    }

    const today = getTodayString();

    if (date < today) {
      return res.status(400).json({
        message: "Geçmiş tarih için kapalı saat eklenemez.",
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
    await deletePastBlockedSlots();

    const blockedSlots = await BlockedSlot.find().sort({
      date: 1,
      startTime: 1,
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

app.delete("/api/blocked-slots/:id", verifyAdminToken, async (req, res) => {
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

app.delete("/api/appointments/:id", verifyAdminToken, async (req, res) => {
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

app.get("/api/reports/income", verifyAdminToken, async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: "approved" });

    const todayString = getTodayString();
    const currentMonth = todayString.slice(0, 7);
    const currentYear = todayString.slice(0, 4);

    let dailyIncome = 0;
    let monthlyIncome = 0;
    let yearlyIncome = 0;

    let dailyRentShare = 0;
    let monthlyRentShare = 0;
    let yearlyRentShare = 0;

    let dailyEmployeeEarning = 0;
    let monthlyEmployeeEarning = 0;
    let yearlyEmployeeEarning = 0;

    const totalAppointments = appointments.length;

    const employeeIncome = {};
    const employeeRentShare = {};
    const employeeEarning = {};

    appointments.forEach((appointment) => {
      const price = Number(appointment.totalPrice || 0);
      const rent = Number(appointment.rentShare || 0);
      const earning = Number(appointment.employeeEarning || 0);

      const appointmentDate = appointment.date;
      const employee = appointment.employee || "Bilinmeyen";

      if (appointmentDate === todayString) {
        dailyIncome += price;
        dailyRentShare += rent;
        dailyEmployeeEarning += earning;
      }

      if (appointmentDate && appointmentDate.startsWith(currentMonth)) {
        monthlyIncome += price;
        monthlyRentShare += rent;
        monthlyEmployeeEarning += earning;
      }

      if (appointmentDate && appointmentDate.startsWith(currentYear)) {
        yearlyIncome += price;
        yearlyRentShare += rent;
        yearlyEmployeeEarning += earning;
      }

      if (!employeeIncome[employee]) {
        employeeIncome[employee] = 0;
      }

      if (!employeeRentShare[employee]) {
        employeeRentShare[employee] = 0;
      }

      if (!employeeEarning[employee]) {
        employeeEarning[employee] = 0;
      }

      employeeIncome[employee] += price;
      employeeRentShare[employee] += rent;
      employeeEarning[employee] += earning;
    });

    res.json({
      dailyIncome,
      monthlyIncome,
      yearlyIncome,

      dailyRentShare,
      monthlyRentShare,
      yearlyRentShare,

      dailyEmployeeEarning,
      monthlyEmployeeEarning,
      yearlyEmployeeEarning,

      totalAppointments,

      employeeIncome,
      employeeRentShare,
      employeeEarning,
    });
  } catch (error) {
    res.status(500).json({
      message: "Gelir raporu alınamadı.",
      error: error.message,
    });
  }
});

app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const users = [
      {
        username: "bilal",
        password: "123456",
        role: "admin",
        employeeKey: "bilal",
      },
      {
        username: "yasar",
        password: "123456",
        role: "user",
        employeeKey: "yasar",
      },
      {
        username: "adil",
        password: "123456",
        role: "user",
        employeeKey: "adil",
      },
      {
        username: "mustafa",
        password: "123456",
        role: "user",
        employeeKey: "mustafa",
      },
      {
        username: "murat",
        password: "123456",
        role: "user",
        employeeKey: "murat",
      },
      {
        username: "duygu",
        password: "123456",
        role: "user",
        employeeKey: "duygu",
      },
    ];

    const user = users.find(
      (item) => item.username === username && item.password === password
    );

    if (!user) {
      return res.status(401).json({
        message: "Kullanıcı adı veya şifre hatalı.",
      });
    }

    const token = jwt.sign(
      {
        role: user.role,
        employeeKey: user.employeeKey,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
      }
    );

    res.json({
      message: "Giriş başarılı.",
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Admin girişi sırasında hata oluştu.",
      error: error.message,
    });
  }
});

cron.schedule("0 10 * * *", async () => {
  try {
    console.log("Hatırlatma SMS kontrolü başladı...");

    const today = new Date();

    const targetDate = new Date();
    targetDate.setDate(today.getDate() - 30);

    const formattedDate = targetDate.toISOString().split("T")[0];

    const appointments = await Appointment.find({
      status: "approved",
      date: formattedDate,
    });

    for (const appointment of appointments) {
      const message = `Sayin ${appointment.name}, ATA MEN'S CLUB olarak sizi tekrar gormekten mutluluk duyariz. Yeni randevunuzu olusturmak icin bizimle iletisime gecebilirsiniz.`;

      await sendSMS(appointment.phone, message);

      console.log(`Hatirlatma SMS gonderildi: ${appointment.phone}`);
    }

    console.log("Hatırlatma SMS kontrolü tamamlandı.");
  } catch (error) {
    console.log("Hatırlatma SMS hatası:", error.message);
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server çalışıyor: ${PORT}`);
});