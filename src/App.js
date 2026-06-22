import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Admin from "./pages/Admin";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function App() {
  const employees = [
    {
      name: "Bilal Ata",
      title: "Erkek Kuaförü",
      services: [
        { name: "Saç + Sakal", duration: 45, price: 500 },
        { name: "Sadece Saç", duration: 30, price: 350 },
        { name: "Sadece Sakal", duration: 20, price: 250 },
      ],
    },
    {
      name: "Yaşar Luş",
      title: "Erkek Kuaförü",
      services: [
        { name: "Saç + Sakal", duration: 45, price: 500 },
        { name: "Sadece Saç", duration: 30, price: 350 },
        { name: "Sadece Sakal", duration: 20, price: 250 },
      ],
    },
    {
      name: "Adil Özel",
      title: "Erkek Kuaförü",
      services: [
        { name: "Saç + Sakal", duration: 45, price: 500 },
        { name: "Sadece Saç", duration: 30, price: 350 },
        { name: "Sadece Sakal", duration: 20, price: 250 },
      ],
    },
    {
      name: "Mustafa Sünnü",
      title: "Erkek Kuaförü",
      services: [
        { name: "Saç + Sakal", duration: 45, price: 500 },
        { name: "Sadece Saç", duration: 30, price: 350 },
        { name: "Sadece Sakal", duration: 20, price: 250 },
      ],
    },
    {
      name: "Murat Hakikat",
      title: "Erkek Kuaförü",
      services: [
        { name: "Saç + Sakal", duration: 45, price: 500 },
        { name: "Sadece Saç", duration: 30, price: 350 },
        { name: "Sadece Sakal", duration: 20, price: 250 },
      ],
    },
    {
      name: "Duygu Sert",
      title: "Kadın Bakım Uzmanı",
      services: [
        { name: "Manikür", duration: 40, price: 400 },
        { name: "Pedikür", duration: 45, price: 500 },
        { name: "Kaş Alımı", duration: 20, price: 200 },
      ],
    },
  ];

  const [appointments, setAppointments] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [employee, setEmployee] = useState("");
  const [service, setService] = useState([]);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getAppointments();
    getBlockedSlots();
  }, []);

  const getAppointments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/appointments`);
      const data = await response.json();

      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Randevular alınamadı", error);
      setAppointments([]);
    }
  };

  const getBlockedSlots = async () => {
    try {
      const response = await fetch(`${API_URL}/api/blocked-slots`);
      const data = await response.json();

      setBlockedSlots(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Kapalı saatler alınamadı", error);
      setBlockedSlots([]);
    }
  };

  const selectedEmployee = employees.find((person) => person.name === employee);

  const selectedServices =
    selectedEmployee?.services.filter((item) => service.includes(item.name)) ||
    [];

  const totalDuration = selectedServices.reduce(
    (total, item) => total + item.duration,
    0
  );

  const totalPrice = selectedServices.reduce(
    (total, item) => total + Number(item.price || 0),
    0
  );

  const generateTimes = () => {
    const list = [];
    let hour = 8;
    let minute = 0;

    while (hour < 22) {
      list.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      );

      minute += 15;

      if (minute === 60) {
        minute = 0;
        hour++;
      }
    }

    return list;
  };

  const times = generateTimes();

  const timeToMinutes = (timeValue) => {
    const [hour, minute] = timeValue.split(":").map(Number);
    return hour * 60 + minute;
  };

  const isTimeBooked = (selectedTime) => {
    if (!employee || !date || totalDuration === 0) return false;

    const selectedStart = timeToMinutes(selectedTime);
    const selectedEnd = selectedStart + totalDuration;

    const appointmentConflict = appointments.some((item) => {
      if (item.employee !== employee || item.date !== date) return false;

      const bookedStart = timeToMinutes(item.time);
      const bookedEnd = bookedStart + Number(item.totalDuration || 0);

      return selectedStart < bookedEnd && selectedEnd > bookedStart;
    });

    const blockedConflict = blockedSlots.some((slot) => {
      if (slot.employee !== employee || slot.date !== date) return false;

      const blockedStart = timeToMinutes(slot.startTime);
      const blockedEnd = timeToMinutes(slot.endTime);

      return selectedStart < blockedEnd && selectedEnd > blockedStart;
    });

    return appointmentConflict || blockedConflict;
  };

  const calculateEndTime = (startTime, duration) => {
    if (!startTime || !duration) return "-";

    const [hour, minute] = startTime.split(":").map(Number);
    const startDate = new Date();

    startDate.setHours(hour);
    startDate.setMinutes(minute);
    startDate.setSeconds(0);
    startDate.setMinutes(startDate.getMinutes() + duration);

    return `${String(startDate.getHours()).padStart(2, "0")}:${String(
      startDate.getMinutes()
    ).padStart(2, "0")}`;
  };

  const endTime = calculateEndTime(time, totalDuration);

  const today = new Date().toISOString().split("T")[0];

  const isSunday = (selectedDate) => {
    if (!selectedDate) return false;
    return new Date(selectedDate).getDay() === 0;
  };

  const clearMessageAfterDelay = () => {
    setTimeout(() => {
      setMessage("");
      setSuccess(false);
    }, 3000);
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmployee("");
    setService([]);
    setIsServiceOpen(false);
    setIsTimeOpen(false);
    setDate("");
    setTime("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !phone || !employee || service.length === 0 || !date || !time) {
      setSuccess(false);
      setMessage("Lütfen tüm alanları doldurun.");
      clearMessageAfterDelay();
      return;
    }

    if (!/^05\d{9}$/.test(phone)) {
      setSuccess(false);
      setMessage("Telefon numarası 05 ile başlamalı ve 11 haneli olmalıdır.");
      clearMessageAfterDelay();
      return;
    }

    if (isTimeBooked(time)) {
      setSuccess(false);
      setMessage("Bu saat dolu veya kapalı. Lütfen başka bir saat seçin.");
      clearMessageAfterDelay();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          employee,
          service,
          totalDuration,
          totalPrice,
          date,
          time,
          endTime,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setMessage("Randevunuz başarıyla oluşturuldu.");

        setAppointments((prev) => [data.appointment, ...prev]);

        resetForm();
        clearMessageAfterDelay();
      } else {
        setSuccess(false);
        setMessage(data.message || "Bir hata oluştu.");
        clearMessageAfterDelay();
      }
    } catch (error) {
      setSuccess(false);
      setMessage("Sunucu bağlantı hatası.");
      clearMessageAfterDelay();
    }
  };

  const appointmentPage = (
    <div className="page">
      <header className="hero">
        <div className="hero-overlay">
          <div className="brand-side">
            <div className="brand-text">
              <h1>ATA</h1>
              <p>MEN'S CLUB</p>
            </div>
          </div>
        </div>
      </header>

      <div className="layout">
        <div className="form-card">
          <h2>Randevu Oluştur</h2>

          <p className="subtitle">Lütfen bilgilerinizi eksiksiz doldurun.</p>

          <form onSubmit={handleSubmit}>
            <label>Ad Soyad</label>

            <input
              type="text"
              placeholder="Ad Soyad"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label>Telefon Numaranız</label>

            <input
              type="tel"
              placeholder="0555 555 55 55"
              value={phone}
              maxLength={11}
              onChange={(e) => {
                const onlyNumbers = e.target.value.replace(/\D/g, "");
                setPhone(onlyNumbers);
              }}
            />

            <label>Çalışan Seçimi</label>

            <select
              value={employee}
              onChange={(e) => {
                setEmployee(e.target.value);
                setService([]);
                setIsServiceOpen(false);
                setTime("");
                setIsTimeOpen(false);
              }}
            >
              <option value="">Çalışan Seç</option>

              {employees.map((person) => (
                <option key={person.name} value={person.name}>
                  {person.name}
                </option>
              ))}
            </select>

            <label>İşlem Seçimi</label>

            <div className="multi-select">
              <div
                className="multi-select-header"
                onClick={() => {
                  if (selectedEmployee) {
                    setIsServiceOpen(!isServiceOpen);
                  }
                }}
              >
                <span>
                  {service.length > 0
                    ? service.join(", ")
                    : selectedEmployee
                    ? "İşlem seçiniz"
                    : "Önce çalışan seçiniz"}
                </span>
              </div>

              {isServiceOpen && selectedEmployee && (
                <div className="multi-select-options">
                  {selectedEmployee.services.map((item) => (
                    <div
                      key={item.name}
                      className={
                        service.includes(item.name)
                          ? "multi-option selected-option"
                          : "multi-option"
                      }

                      onClick={() => {
  if (service.includes(item.name)) {
    setService(service.filter((s) => s !== item.name));
  } else {
    setService([...service, item.name]);
  }

  setTime("");
  setIsTimeOpen(false);
}}
                    >
                      <div className="service-info">
                        <strong>{item.name}</strong>
                      </div>

                      <span>{service.includes(item.name) ? "✓" : ""}</span>
                    </div>
                  ))}

                  <button
  type="button"
  className="service-done-btn"
  onClick={() => setIsServiceOpen(false)}
>
  Tamam
</button>

                </div>
              )}
            </div>

            <label>Tarih</label>

            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => {
                const selectedDate = e.target.value;

                if (isSunday(selectedDate)) {
                  setSuccess(false);
                  setMessage(
                    "Pazar günleri kapalıyız. Lütfen başka bir tarih seçin."
                  );
                  setDate("");
                  setTime("");
                  setIsTimeOpen(false);
                  clearMessageAfterDelay();
                  return;
                }

                setDate(selectedDate);
                setTime("");
                setIsTimeOpen(false);
              }}
            />

            <label>Saat Seçimi</label>

            <div className="time-select">
              <div
                className="time-select-header"
                onClick={() => setIsTimeOpen(!isTimeOpen)}
              >
                <span>{time || "Saat seçiniz"}</span>
              </div>

              {isTimeOpen && (
                <div className="time-select-options">
                  {times.map((t) => {
                    const booked = isTimeBooked(t);

                    return (
                      <button
                        type="button"
                        key={t}
                        disabled={booked}
                        className={
                          booked ? "booked-time" : time === t ? "selected" : ""
                        }
                        onClick={() => {
                          if (booked) return;
                          setTime(t);
                          setIsTimeOpen(false);
                        }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="secure-box">
              Bilgileriniz üçüncü kişilerle paylaşılmaz.
            </div>

            <button className="submit-btn" type="submit">
              Randevu Oluştur
            </button>

            {message && (
              <div
                className={success ? "message-box success" : "message-box error"}
              >
                {message}
              </div>
            )}
          </form>
        </div>

        <div className="summary-card">
          <h3>Randevu Özeti</h3>

          <ul>
            <li>
              <strong>Ad Soyad:</strong> {name || "-"}
            </li>

            <li>
              <strong>Telefon:</strong> {phone || "-"}
            </li>

            <li>
              <strong>Çalışan:</strong> {employee || "-"}
            </li>

            <li>
              <strong>İşlem:</strong>{" "}
              {service.length > 0 ? service.join(", ") : "-"}
            </li>

            <li>
              <strong>Toplam Süre:</strong>{" "}
              {totalDuration > 0 ? `${totalDuration} dk` : "-"}
            </li>

            <li>
              <strong>Toplam Ücret:</strong>{" "}
              {totalPrice > 0 ? `${totalPrice} TL` : "-"}
            </li>

            <li>
              <strong>Tarih:</strong> {date || "-"}
            </li>

            <li>
              <strong>Başlangıç:</strong> {time || "-"}
            </li>

            <li>
              <strong>Bitiş:</strong> {endTime}
            </li>
          </ul>

          <div className="summary-info">
            <div className="info-card">🕒 08:00 - 22:00</div>
            <div className="info-card">📅 Pazar Günleri Kapalı</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={appointmentPage} />
        <Route
  path="/ata-bilal-2026-panel"
  element={<Admin onBack={() => (window.location.href = "/")} />}
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;