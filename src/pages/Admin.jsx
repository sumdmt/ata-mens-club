import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000";

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
  useEffect(() => {
  const token = localStorage.getItem("adminToken");

  if (token) {
    setIsLoggedIn(true);
  }
}, []);
  const [loginError, setLoginError] = useState("");

  const [filterDate, setFilterDate] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [appointmentView, setAppointmentView] = useState("today");

  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editEmployee, setEditEmployee] = useState("");

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

  const handleLogout = () => {
  localStorage.removeItem("adminToken");
  setIsLoggedIn(false);
};

  const handleLogin = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch(
      "http://localhost:5000/api/admin/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("adminToken", data.token);

      setIsLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError(data.message || "Şifre hatalı.");
    }
  } catch (error) {
    setLoginError("Sunucu bağlantı hatası.");
  }
};

  const updateAppointmentStatus = async (id, status) => {
    try {
      const response = await fetch(`${API_URL}/api/appointments/${id}/status`, {
        method: "PUT",
        headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
},
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (response.ok) {
  alert("Randevu durumu güncellendi.");

  setAppointments((prev) =>
    prev.map((item) =>
      item._id === id ? { ...item, status: data.appointment.status } : item
    )
  );
}
       else {
        alert(data.message || "Randevu durumu güncellenemedi.");
      }
    } catch (error) {
      console.log("Durum güncellenemedi", error);
      alert("Sunucu bağlantı hatası.");
    }
  };

  const getStatusText = (status) => {
    if (status === "approved") return "Onaylandı";
    if (status === "rejected") return "Reddedildi";
    return "Beklemede";
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
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
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
    const response = await fetch(`${API_URL}/api/blocked-slots/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });

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
  headers: {
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
  },
}
    );

    if (response.ok) {
      setAppointments((prev) =>
        prev.filter((item) => item._id !== id)
      );
    }
  } catch (error) {
    console.log("Randevu silinemedi", error);
  }
};

const startEditAppointment = (appointment) => {
  setEditingAppointment(appointment);
  setEditDate(appointment.date || "");
  setEditTime(appointment.time || "");
  setEditEmployee(appointment.employee || "");
};

const cancelEditAppointment = () => {
  setEditingAppointment(null);
  setEditDate("");
  setEditTime("");
  setEditEmployee("");
};

const updateAppointment = async () => {
  if (!editingAppointment || !editDate || !editTime || !editEmployee) {
    alert("Lütfen tarih, saat ve çalışan bilgilerini doldurun.");
    return;
  }

  try {

const [hour, minute] = editTime.split(":").map(Number);

const totalMinutes =
  hour * 60 +
  minute +
  Number(editingAppointment.totalDuration || 0);

const endHour = Math.floor(totalMinutes / 60);
const endMinute = totalMinutes % 60;

const calculatedEndTime = `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;

    const response = await fetch(
      `${API_URL}/api/appointments/${editingAppointment._id}`,
      {
        method: "PUT",
        headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
},
        body: JSON.stringify({
          ...editingAppointment,
          date: editDate,
          time: editTime,
          endTime: calculatedEndTime,
          employee: editEmployee,
        }),
      }
    );

    const data = await response.json();

    
   if (response.ok) {
  setAppointments((prev) =>
    prev.map((item) =>
      item._id === editingAppointment._id
        ? data.appointment
        : item
    )
  );

  cancelEditAppointment();
  alert("Randevu güncellendi.");
} else {
  alert(data.message || "Randevu güncellenemedi.");
}
  } catch (error) {
    console.log("Randevu güncellenemedi", error);
    alert("Sunucu bağlantı hatası.");
  }
};


  const filteredAppointments = appointments
  .filter((item) => {
    const dateMatch = filterDate ? item.date === filterDate : true;

    const employeeMatch = filterEmployee
      ? item.employee === filterEmployee
      : true;

    return dateMatch && employeeMatch;
  })
  .sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);

    return dateA - dateB;
  });

  const today = new Date().toISOString().split("T")[0];

const todayAppointments = filteredAppointments.filter(
  (item) => item.date === today
);

const pastAppointments = filteredAppointments.filter(
  (item) => item.date < today
);

const futureAppointments = filteredAppointments.filter(
  (item) => item.date > today
);

const displayedAppointments =
  appointmentView === "today"
    ? todayAppointments
    : appointmentView === "future"
    ? futureAppointments
    : appointmentView === "past"
    ? pastAppointments
    : filteredAppointments;

  const clearFilters = () => {
    setFilterDate("");
    setFilterEmployee("");
  };

  const totalAppointments = filteredAppointments.length;

const pendingAppointments = filteredAppointments.filter(
  (item) => !item.status || item.status === "pending"
).length;

const approvedAppointments = filteredAppointments.filter(
  (item) => item.status === "approved"
).length;

const rejectedAppointments = filteredAppointments.filter(
  (item) => item.status === "rejected"
).length;

const currentMonth = today.slice(0, 7);
const currentYear = today.slice(0, 4);
const totalIncome = appointments
  .filter((item) => item.status === "approved")
  .reduce((total, item) => total + Number(item.totalPrice || 0), 0);

const todayIncome = appointments
  .filter((item) => item.status === "approved" && item.date === today)
  .reduce((total, item) => total + Number(item.totalPrice || 0), 0);

const monthlyIncome = appointments
  .filter(
    (item) =>
      item.status === "approved" &&
      item.date &&
      item.date.startsWith(currentMonth)
  )
  .reduce((total, item) => total + Number(item.totalPrice || 0), 0);

  const yearlyIncome = appointments
  .filter(
    (item) =>
      item.status === "approved" &&
      item.date &&
      item.date.startsWith(currentYear)
  )
  .reduce((total, item) => total + Number(item.totalPrice || 0), 0);

const approvedCount = filteredAppointments.filter(
  (item) => item.status === "approved"
).length;

const pendingCount = filteredAppointments.filter(
  (item) => !item.status || item.status === "pending"
).length;

const employeeReports = employees.map((employee) => {
  const employeeAppointments = appointments.filter(
    (item) => item.employee === employee
  );

  const approvedEmployeeAppointments = employeeAppointments.filter(
    (item) => item.status === "approved"
  );

  const employeeIncome = approvedEmployeeAppointments.reduce(
    (total, item) => total + Number(item.totalPrice || 0),
    0
  );

  return {
    employee,
    totalAppointments: employeeAppointments.length,
    approvedAppointments: approvedEmployeeAppointments.length,
    income: employeeIncome,
  };
});

const serviceStats = {};

appointments.forEach((appointment) => {
  const services = Array.isArray(appointment.service)
    ? appointment.service
    : [appointment.service];

  services.forEach((service) => {
    if (!service) return;

    serviceStats[service] = (serviceStats[service] || 0) + 1;
  });
});

const sortedServices = Object.entries(serviceStats).sort(
  (a, b) => b[1] - a[1]
);

const token = localStorage.getItem("adminToken");

if (!token) {
  return (
    <div className="admin-page">
      <h2>Yetkisiz erişim</h2>
    </div>
  );
}

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
  <div className="admin-top-buttons">
    <button
      type="button"
      className="back-btn"
      onClick={onBack}
    >
      Randevu Sayfasına Dön
    </button>

    <button
      type="button"
      className="logout-btn"
      onClick={handleLogout}
    >
      Çıkış Yap
    </button>
  </div>

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

<div className="admin-summary">
  <div className="summary-card">
    <span>Toplam Randevu</span>
    <strong>{totalAppointments}</strong>
  </div>

  <div className="summary-card">
    <span>Bekleyen</span>
    <strong>{pendingAppointments}</strong>
  </div>

  <div className="summary-card">
    <span>Onaylanan</span>
    <strong>{approvedAppointments}</strong>
  </div>

  <div className="summary-card">
    <span>Reddedilen</span>
    <strong>{rejectedAppointments}</strong>
  </div>

  <div className="summary-card income-card">
    <span>Onaylı Gelir</span>
    <strong>{totalIncome} TL</strong>
  </div>

<div className="summary-card income-card">
  <span>Bugünkü Gelir</span>
  <strong>{todayIncome} TL</strong>
</div>

<div className="summary-card income-card">
  <span>Bu Ayki Gelir</span>
  <strong>{monthlyIncome} TL</strong>
</div>

<div className="summary-card income-card">
  <span>Bu Yılki Gelir</span>
  <strong>{yearlyIncome} TL</strong>
</div>

</div>

      <p className="admin-count">
        Gösterilen randevu sayısı: {filteredAppointments.length}
      </p>

      <div className="employee-report-box">
        <h2>En Çok Yapılan İşlemler</h2>

        <div className="service-report-grid">
    {sortedServices.map(([service, count]) => (
      <div className="employee-report-card" key={service}>
        <h3>{service}</h3>

        <p>
          <strong>Toplam:</strong> {count}
        </p>
      </div>
    ))}
  </div>
</div>

<div className="employee-report-box">
  <h2>Çalışan Bazlı Rapor</h2>

  <div className="employee-report-grid">
    {employeeReports.map((report) => (
      <div className="employee-report-card" key={report.employee}>
        <h3>{report.employee}</h3>

        <p>
          <strong>Toplam Randevu:</strong> {report.totalAppointments}
        </p>

        <p>
          <strong>Onaylı Randevu:</strong> {report.approvedAppointments}
        </p>

        <p>
          <strong>Gelir:</strong> {report.income} TL
        </p>
      </div>
    ))}
  </div>
</div>

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

{editingAppointment && (
  <div className="edit-box">
    <h3>Randevu Düzenle</h3>

    <input
      type="date"
      value={editDate}
      onChange={(e) => setEditDate(e.target.value)}
    />

    <input
      type="time"
      value={editTime}
      onChange={(e) => setEditTime(e.target.value)}
    />

    <select
      value={editEmployee}
      onChange={(e) => setEditEmployee(e.target.value)}
    >
      <option value="Bilal Ata">Bilal Ata</option>
      <option value="Yaşar Luş">Yaşar Luş</option>
      <option value="Adil Özel">Adil Özel</option>
      <option value="Mustafa Sünnü">Mustafa Sünnü</option>
      <option value="Murat Hakikat">Murat Hakikat</option>
      <option value="Duygu Sert">Duygu Sert</option>
    </select>

    <div className="edit-buttons">
      <button onClick={updateAppointment}>
        Kaydet
      </button>

      <button onClick={cancelEditAppointment}>
        İptal
      </button>
    </div>
  </div>
)}

      <div className="appointment-tabs">
  <button
    type="button"
    className={appointmentView === "today" ? "active-tab" : ""}
    onClick={() => setAppointmentView("today")}
  >
    Bugünkü Randevular ({todayAppointments.length})
  </button>

  <button
    type="button"
    className={appointmentView === "future" ? "active-tab" : ""}
    onClick={() => setAppointmentView("future")}
  >
    Gelecek Randevular ({futureAppointments.length})
  </button>

  <button
    type="button"
    className={appointmentView === "past" ? "active-tab" : ""}
    onClick={() => setAppointmentView("past")}
  >
    Geçmiş Randevular ({pastAppointments.length})
  </button>

  <button
    type="button"
    className={appointmentView === "all" ? "active-tab" : ""}
    onClick={() => setAppointmentView("all")}
  >
    Tümü ({filteredAppointments.length})
  </button>
</div>

      <div className="admin-list">
        {displayedAppointments.length === 0 ? (
          <p>Filtreye uygun randevu yok.</p>
        ) : (
          displayedAppointments.map((item) => (
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

              <p>
  <strong>Ücret:</strong>{" "}
  {Number(item.totalPrice) > 0 ? `${item.totalPrice} TL` : "Ücret belirtilmedi"}
</p>

              <div
  className={`status-badge ${
    item.status === "approved"
      ? "status-approved"
      : item.status === "rejected"
      ? "status-rejected"
      : "status-pending"
  }`}
>
  {item.status === "approved"
    ? "✓ Onaylandı"
    : item.status === "rejected"
    ? "✕ Reddedildi"
    : "⏳ Beklemede"}
</div>

              <div className="appointment-actions">
                <button
                  type="button"
                  className="approve-btn"
                  onClick={() => updateAppointmentStatus(item._id, "approved")}
                  disabled={item.status === "approved"}
                >
                  Onayla
                </button>

                <button
                  type="button"
                  className="reject-btn"
                  onClick={() => updateAppointmentStatus(item._id, "rejected")}
                  disabled={item.status === "rejected"}
                >
                  Reddet
                </button>

<button
  type="button"
  className="edit-btn"
  onClick={() => startEditAppointment(item)}
>
  Randevuyu Düzenle
</button>

                <button
                  className="delete-btn"
                  onClick={() => deleteAppointment(item._id)}
                >
                  Randevuyu Sil
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Admin;