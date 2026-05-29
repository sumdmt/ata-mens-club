import { useEffect, useState } from "react";
const API_URL = "https://ata-mens-club.onrender.com";

function Admin({ onBack }) {
  const employees = [
    "Bilal Ata",
    "Yaşar Luş",
    "Adil Özel",
    "Mustafa Sünnü",
    "Murat Hakikat",
    "Duygu Sert",
  ];

  const [appointments, setAppointments] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);

  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [filterDate, setFilterDate] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");

  const [blockEmployee, setBlockEmployee] = useState("");
  const [blockDate, setBlockDate] = useState("");
  const [blockStartTime, setBlockStartTime] = useState("");
  const [blockEndTime, setBlockEndTime] = useState("");
  const [blockReason, setBlockReason] = useState("");

  useEffect(() => {
    if (isLoggedIn) {
      fetchAppointments();
      fetchBlockedSlots();
    }
  }, [isLoggedIn]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/appointments`);
      const data = await response.json();

      setAppointments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Randevular alınamadı", error);
      setAppointments([]);
    }
  };

  const fetchBlockedSlots = async () => {
    try {
      const response = await fetch(`${API_URL}/api/blocked-slots`);
      const data = await response.json();

      setBlockedSlots(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Kapalı saatler alınamadı", error);
      setBlockedSlots([]);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();

    if (password === "1234") {
      setIsLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("Şifre hatalı.");
    }
  };

  const addBlockedSlot = async () => {
    if (!blockEmployee || !blockDate || !blockStartTime || !blockEndTime) {
      alert("Lütfen çalışan, tarih, başlangıç ve bitiş saatini doldurun.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/blocked-slots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee: blockEmployee,
          date: blockDate,
          startTime: blockStartTime,
          endTime: blockEndTime,
          reason: blockReason || "Kapalı saat",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setBlockedSlots((prev) => [data.blockedSlot, ...prev]);

        setBlockEmployee("");
        setBlockDate("");
        setBlockStartTime("");
        setBlockEndTime("");
        setBlockReason("");
      } else {
        alert(data.message || "Kapalı saat eklenemedi.");
      }
    } catch (error) {
      console.log("Kapalı saat eklenemedi", error);
      alert("Sunucu bağlantı hatası.");
    }
  };

  const deleteBlockedSlot = async (id) => {
    const confirmDelete = window.confirm(
      "Bu kapalı saati silmek istediğinize emin misiniz?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
       `${API_URL}/api/blocked-slots/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setBlockedSlots((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (error) {
      console.log("Kapalı saat silinemedi", error);
    }
  };

  const deleteAppointment = async (id) => {
    const confirmDelete = window.confirm(
      "Bu randevuyu silmek istediğinize emin misiniz?"
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${API_URL}/api/appointments/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setAppointments((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (error) {
      console.log("Randevu silinemedi", error);
    }
  };

  const filteredAppointments = appointments.filter((item) => {
    const dateMatch = filterDate ? item.date === filterDate : true;

    const employeeMatch = filterEmployee
      ? item.employee === filterEmployee
      : true;

    return dateMatch && employeeMatch;
  });

  const clearFilters = () => {
    setFilterDate("");
    setFilterEmployee("");
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-page">
        <button type="button" className="back-btn" onClick={onBack}>
          Randevu Sayfasına Dön
        </button>

        <div className="admin-login-card">
          <h1>Admin Girişi</h1>

          <form onSubmit={handleLogin}>
            <label>Şifre</label>

            <input
              type="password"
              placeholder="Admin şifresi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit" className="delete-btn">
              Giriş Yap
            </button>

            {loginError && <p className="admin-login-error">{loginError}</p>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <button type="button" className="back-btn" onClick={onBack}>
        Randevu Sayfasına Dön
      </button>

      <h1>Admin Paneli</h1>

      <div className="admin-filter-box">
        <div>
          <label>Tarihe Göre Filtrele</label>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        <div>
          <label>Çalışana Göre Filtrele</label>

          <select
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
          >
            <option value="">Tüm çalışanlar</option>

            {employees.map((employee) => (
              <option key={employee} value={employee}>
                {employee}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="filter-clear-btn" onClick={clearFilters}>
          Filtreleri Temizle
        </button>
      </div>

      <p className="admin-count">
        Gösterilen randevu sayısı: {filteredAppointments.length}
      </p>

      <div className="blocked-slot-box">
        <h2>Kapalı Saat Ekle</h2>

        <div className="blocked-slot-form">
          <select
            value={blockEmployee}
            onChange={(e) => setBlockEmployee(e.target.value)}
          >
            <option value="">Çalışan seç</option>

            {employees.map((employee) => (
              <option key={employee} value={employee}>
                {employee}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={blockDate}
            onChange={(e) => setBlockDate(e.target.value)}
          />

          <input
            type="time"
            value={blockStartTime}
            onChange={(e) => setBlockStartTime(e.target.value)}
          />

          <input
            type="time"
            value={blockEndTime}
            onChange={(e) => setBlockEndTime(e.target.value)}
          />

          <input
            type="text"
            placeholder="Açıklama örn: İzinli"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
          />

          <button type="button" onClick={addBlockedSlot}>
            Kapalı Saat Ekle
          </button>
        </div>

        <div className="blocked-slot-list">
          {blockedSlots.length === 0 ? (
            <p>Henüz kapalı saat yok.</p>
          ) : (
            blockedSlots.map((slot) => (
              <div className="blocked-slot-card" key={slot._id}>
                <strong>{slot.employee}</strong>

                <span>{slot.date}</span>

                <span>
                  {slot.startTime} - {slot.endTime}
                </span>

                <span>{slot.reason}</span>

                <button
                  type="button"
                  onClick={() => deleteBlockedSlot(slot._id)}
                >
                  Sil
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="admin-list">
        {filteredAppointments.length === 0 ? (
          <p>Filtreye uygun randevu yok.</p>
        ) : (
          filteredAppointments.map((item) => (
            <div className="admin-card" key={item._id}>
              <h3>{item.name}</h3>

              <p>
                <strong>Telefon:</strong> {item.phone}
              </p>

              <p>
                <strong>Çalışan:</strong> {item.employee}
              </p>

              <p>
                <strong>İşlem:</strong>{" "}
                {Array.isArray(item.service)
                  ? item.service.join(", ")
                  : item.service}
              </p>

              <p>
                <strong>Tarih:</strong> {item.date}
              </p>

              <p>
                <strong>Saat:</strong> {item.time}
              </p>

              {item.endTime && (
                <p>
                  <strong>Bitiş:</strong> {item.endTime}
                </p>
              )}

              {item.totalDuration && (
                <p>
                  <strong>Süre:</strong> {item.totalDuration} dk
                </p>
              )}

              {item.totalPrice && (
  <p>
    <strong>Ücret:</strong> {item.totalPrice} TL
  </p>
)}

              <button
                className="delete-btn"
                onClick={() => deleteAppointment(item._id)}
              >
                Randevuyu Sil
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Admin;