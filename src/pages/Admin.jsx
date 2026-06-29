import { useEffect, useState } from "react";
import {
  FiUser,
  FiPhone,
  FiCalendar,
  FiClock,
  FiScissors,
  FiDollarSign,
  FiCheck,
  FiX,
  FiEdit,
  FiTrash2,
  FiBriefcase,
} from "react-icons/fi";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
  const [username, setUsername] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [filterDate, setFilterDate] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [appointmentView, setAppointmentView] = useState("all");

  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editEmployee, setEditEmployee] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const [blockEmployee, setBlockEmployee] = useState("");
  const [blockDate, setBlockDate] = useState("");
  const [blockStartTime, setBlockStartTime] = useState("");
  const [blockEndTime, setBlockEndTime] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [searchText, setSearchText] = useState("");
  const [visibleCount, setVisibleCount] = useState(5);
  const [incomeReport, setIncomeReport] = useState(null);

  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newEmployee, setNewEmployee] = useState("");
  const [newService, setNewService] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newPrice, setNewPrice] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchAppointments();
      fetchBlockedSlots();
      fetchIncomeReport();
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

  const fetchIncomeReport = async () => {
  try {
    const response = await fetch(`${API_URL}/api/reports/income`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      setIncomeReport(data);
    }
  } catch (error) {
    console.log("Gelir raporu alınamadı", error);
  }
};

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsLoggedIn(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

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
      } else {
        alert(data.message || "Randevu durumu güncellenemedi.");
      }
    } catch (error) {
      console.log("Durum güncellenemedi", error);
      alert("Sunucu bağlantı hatası.");
    }
  };

  const createAdminAppointment = async () => {
  if (
    !newCustomerName ||
    !newCustomerPhone ||
    !newEmployee ||
    !newService ||
    !newDate ||
    !newTime ||
    !newPrice
  ) {
    alert("Lütfen tüm alanları doldurun.");
    return;
  }

  try {
    const serviceDurations = {
      "Saç + Sakal": 45,
      "Sadece Saç": 30,
      "Sadece Sakal": 20,
      "Cilt Bakımı": 30,
      "Manikür": 45,
      "Pedikür": 60,
      "Kaş": 15,
    };

    const duration = serviceDurations[newService] || 30;

    const [hour, minute] = newTime.split(":").map(Number);

    const totalMinutes = hour * 60 + minute + duration;

    const endHour = Math.floor(totalMinutes / 60);
    const endMinute = totalMinutes % 60;

    const endTime = `${String(endHour).padStart(2, "0")}:${String(
      endMinute
    ).padStart(2, "0")}`;

    const response = await fetch(`${API_URL}/api/admin/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
      body: JSON.stringify({
        name: newCustomerName,
        phone: newCustomerPhone,
        employee: newEmployee,
        service: [newService],
        totalDuration: duration,
        totalPrice: Number(newPrice),
        date: newDate,
        time: newTime,
        endTime,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      alert("Randevu oluşturuldu.");

      setAppointments((prev) => [data.appointment, ...prev]);

      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewEmployee("");
      setNewService("");
      setNewDate("");
      setNewTime("");
      setNewPrice("");

      fetchIncomeReport();
    } else {
      alert(data.message || "Randevu oluşturulamadı.");
    }
  } catch (error) {
    console.log(error);
    alert("Sunucu bağlantı hatası.");
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
      const response = await fetch(`${API_URL}/api/appointments/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (response.ok) {
        setAppointments((prev) => prev.filter((item) => item._id !== id));
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
    setEditPrice(appointment.price || appointment.totalPrice || "");
  };

  const cancelEditAppointment = () => {
    setEditingAppointment(null);
    setEditDate("");
    setEditTime("");
    setEditEmployee("");
    setEditPrice("");
  };

  const updateAppointment = async () => {
    if (!editingAppointment || !editDate || !editTime || !editEmployee) {
      alert("Lütfen tarih, saat ve çalışan bilgilerini doldurun.");
      return;
    }

    try {
      const [hour, minute] = editTime.split(":").map(Number);

      const totalMinutes =
        hour * 60 + minute + Number(editingAppointment.totalDuration || 0);

      const endHour = Math.floor(totalMinutes / 60);
      const endMinute = totalMinutes % 60;

      const calculatedEndTime = `${String(endHour).padStart(2, "0")}:${String(
        endMinute
      ).padStart(2, "0")}`;

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
            price: Number(editPrice),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAppointments((prev) =>
          prev.map((item) =>
            item._id === editingAppointment._id ? data.appointment : item
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

  const token = localStorage.getItem("adminToken");

  let decodedToken = null;

  if (token) {
    decodedToken = JSON.parse(atob(token.split(".")[1]));
  }

  const normalizeText = (text) =>
    text
      ?.toLowerCase()
      .replaceAll("ş", "s")
      .replaceAll("ı", "i")
      .replaceAll("ğ", "g")
      .replaceAll("ü", "u")
      .replaceAll("ö", "o")
      .replaceAll("ç", "c")
      .replaceAll("Å\u009f", "s")
      .replaceAll("Å\u009e", "s");

  const getEmployeeKey = (employeeName) => {
    const text = normalizeText(employeeName);

    if (text.includes("bilal")) return "bilal";
    if (text.includes("yasar")) return "yasar";
    if (text.includes("adil")) return "adil";
    if (text.includes("mustafa")) return "mustafa";
    if (text.includes("murat")) return "murat";
    if (text.includes("duygu")) return "duygu";

    return "";
  };

  const isAdmin = decodedToken?.role === "admin";

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

      return dateB - dateA;
    });

  const today = new Date().toISOString().split("T")[0];

  const todayAppointments = filteredAppointments.filter(
    (item) => item.date === today
  );

  const pastAppointments = filteredAppointments.filter((item) => item.date < today);

  const pendingAppointments = filteredAppointments.filter(
    (item) => item.status === "pending"
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
      : appointmentView === "pending"
      ? pendingAppointments
      : filteredAppointments;

  const searchedAppointments = displayedAppointments.filter((item) => {
    const search = searchText.toLowerCase();

    return (
      item.name?.toLowerCase().includes(search) || item.phone?.includes(search)
    );
  });

  const visibleAppointments = isAdmin
    ? searchedAppointments
    : searchedAppointments.filter(
        (item) => getEmployeeKey(item.employee) === decodedToken?.employeeKey
      );

  const clearFilters = () => {
    setFilterDate("");
    setFilterEmployee("");
  };

  const totalAppointments = filteredAppointments.length;

  const approvedAppointments = filteredAppointments.filter(
    (item) => item.status === "approved"
  ).length;

  const rejectedAppointments = filteredAppointments.filter(
    (item) => item.status === "rejected"
  ).length;

  const currentMonth = today.slice(0, 7);
  const currentYear = today.slice(0, 4);


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

  const chartData = employees.map((employee) => ({
  name: employee.split(" ")[0],
  gelir: incomeReport?.employeeIncome?.[employee] || 0,
  kira: incomeReport?.employeeRentShare?.[employee] || 0,
  kazanc: incomeReport?.employeeEarning?.[employee] || 0,
}));

  if (!isLoggedIn) {
    return (
      <div className="admin-page">
        <button type="button" className="back-btn" onClick={onBack}>
          Randevu Sayfasına Dön
        </button>

        <div className="admin-login-card">
          <h1>Admin Girişi</h1>

          <form onSubmit={handleLogin}>
            <label>Kullanıcı Adı</label>
            <input
              type="text"
              placeholder="Kullanıcı adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

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
        <button type="button" className="back-btn" onClick={onBack}>
          Randevu Sayfasına Dön
        </button>

        <button type="button" className="logout-btn" onClick={handleLogout}>
          Çıkış Yap
        </button>
      </div>

      <h1>Admin Paneli</h1>

      {isAdmin && (
        <>
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

            <button
              type="button"
              className="filter-clear-btn"
              onClick={clearFilters}
            >
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
              <strong>{pendingAppointments.length}</strong>
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
              <span>Bugünkü Gelir</span>
              <strong>{incomeReport?.dailyIncome || 0} TL</strong>
            </div>

            <div className="summary-card income-card">
              <span>Bu Ayki Gelir</span>
              <strong>{incomeReport?.monthlyIncome || 0} TL</strong>
            </div>

            <div className="summary-card income-card">
              <span>Bu Yılki Gelir</span>
              <strong>{incomeReport?.yearlyIncome || 0} TL</strong>
            </div>

            <div className="summary-card income-card">
            <span>Bugünkü Kira Payı</span>
            <strong>{incomeReport?.dailyRentShare || 0} TL</strong>
            </div>

            <div className="summary-card income-card">
            <span>Bu Ayki Kira Payı</span>
            <strong>{incomeReport?.monthlyRentShare || 0} TL</strong>
            </div>

<div className="summary-card income-card">
  <span>Bu Ay Çalışan Kazancı</span>
  <strong>{incomeReport?.monthlyEmployeeEarning || 0} TL</strong>
</div>

          </div>

          <p className="admin-count">
            Gösterilen randevu sayısı: {displayedAppointments.length}
          </p>

          <div className="employee-report-box">
            <h2>Çalışan Bazlı Rapor</h2>

            <div className="admin-table-wrapper">
  <table className="admin-table">
    <thead>
      <tr>
        <th>Çalışan</th>
        <th>Toplam Gelir</th>
        <th>Kira Payı</th>
        <th>Çalışan Kazancı</th>
      </tr>
    </thead>

    <tbody>
      {employees.map((employee) => (
        <tr key={employee}>
          <td>{employee}</td>

          <td>
            {incomeReport?.employeeIncome?.[employee] || 0} TL
          </td>

          <td>
            {incomeReport?.employeeRentShare?.[employee] || 0} TL
          </td>

          <td>
            {incomeReport?.employeeEarning?.[employee] || 0} TL
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

<div className="employee-report-box">
  <h2>Çalışan Gelir Grafiği</h2>

  <div style={{ width: "100%", height: 400 }}>
    <ResponsiveContainer>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />

        <XAxis dataKey="name" />

        <YAxis />

        <Tooltip />

        <Bar
          dataKey="gelir"
          fill="#1f2937"
          radius={[8, 8, 0, 0]}
        />

        <Bar
          dataKey="kira"
          fill="#16a34a"
          radius={[8, 8, 0, 0]}
        />

        <Bar
          dataKey="kazanc"
          fill="#2563eb"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>

            <div className="employee-report-grid">
              {employeeReports.map((report) => (
                <div className="employee-report-card" key={report.employee}>
                  <h3>{report.employee}</h3>

                  <p>
                    <strong>Toplam Randevu:</strong> {report.totalAppointments}
                  </p>

                  <p>
                    <strong>Onaylı Randevu:</strong>{" "}
                    {report.approvedAppointments}
                  </p>

                  <p>
                    <strong>Gelir:</strong> {report.income} TL
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-create-box">
  <h2>Hızlı Randevu Oluştur</h2>

  <div className="admin-create-form">
    <input
      type="text"
      placeholder="Müşteri Ad Soyad"
      value={newCustomerName}
      onChange={(e) => setNewCustomerName(e.target.value)}
    />

    <input
      type="text"
      placeholder="Telefon"
      value={newCustomerPhone}
      onChange={(e) => setNewCustomerPhone(e.target.value)}
    />

    <select
      value={newEmployee}
      onChange={(e) => setNewEmployee(e.target.value)}
    >
      <option value="">Çalışan seç</option>

      {employees.map((employee) => (
        <option key={employee} value={employee}>
          {employee}
        </option>
      ))}
    </select>

    <select
      value={newService}
      onChange={(e) => setNewService(e.target.value)}
    >
      <option value="">İşlem seç</option>

      <option value="Saç + Sakal">Saç + Sakal</option>
      <option value="Sadece Saç">Sadece Saç</option>
      <option value="Sadece Sakal">Sadece Sakal</option>
      <option value="Cilt Bakımı">Cilt Bakımı</option>
      <option value="Manikür">Manikür</option>
      <option value="Pedikür">Pedikür</option>
      <option value="Kaş">Kaş</option>
    </select>

    <input
      type="date"
      value={newDate}
      onChange={(e) => setNewDate(e.target.value)}
    />

    <input
      type="time"
      value={newTime}
      onChange={(e) => setNewTime(e.target.value)}
    />

    <input
      type="number"
      placeholder="Ücret"
      value={newPrice}
      onChange={(e) => setNewPrice(e.target.value)}
    />

    <button type="button" onClick={createAdminAppointment}>
      Randevu Oluştur
    </button>
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
        </>
      )}

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
            {employees.map((employee) => (
              <option key={employee} value={employee}>
                {employee}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Ücret"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
          />

          <div className="edit-buttons">
            <button type="button" onClick={updateAppointment}>
              Kaydet
            </button>

            <button type="button" onClick={cancelEditAppointment}>
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
          Bugünkü Randevular
        </button>

        <button
          type="button"
          className={appointmentView === "future" ? "active-tab" : ""}
          onClick={() => setAppointmentView("future")}
        >
          Gelecek Randevular
        </button>

        <button
          type="button"
          className={appointmentView === "past" ? "active-tab" : ""}
          onClick={() => setAppointmentView("past")}
        >
          Geçmiş Randevular
        </button>

        <button
          type="button"
          className={appointmentView === "pending" ? "active-tab" : ""}
          onClick={() => setAppointmentView("pending")}
        >
          Onay Bekleyenler
        </button>

        <button
          type="button"
          className={appointmentView === "all" ? "active-tab" : ""}
          onClick={() => setAppointmentView("all")}
        >
          Tümü
        </button>
      </div>

      <div className="appointment-search-box">
        <input
          type="text"
          placeholder="İsim veya telefon numarası ara..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>


      <div className="admin-list">
  {visibleAppointments.length === 0 ? (
    <p>Filtreye uygun randevu yok.</p>
  ) : (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Saat</th>
            <th>Müşteri</th>
            <th>Telefon</th>
            <th>Çalışan</th>
            <th>İşlem</th>
            <th>Ücret</th>
            <th>Kira Payı</th>
            <th>Çalışan Kazancı</th>
            <th>Durum</th>
            {isAdmin && <th>İşlemler</th>}
          </tr>
        </thead>

        <tbody>
          {visibleAppointments.slice(0, visibleCount).map((item) => (
            <tr key={item._id}>
              <td>{item.date}</td>
              <td>{item.time}</td>
              <td>{item.name}</td>
              <td>{item.phone}</td>
              <td>{item.employee}</td>

              <td>
                {Array.isArray(item.service)
                  ? item.service.join(", ")
                  : item.service}
              </td>

              <td>{Number(item.totalPrice || 0)} TL</td>
              <td>{Number(item.rentShare || 0)} TL</td>
              <td>{Number(item.employeeEarning || 0)} TL</td>

              <td>
                <span
                  className={`table-status ${
                    item.status === "approved"
                      ? "status-approved"
                      : item.status === "rejected"
                      ? "status-rejected"
                      : "status-pending"
                  }`}
                >
                  {item.status === "approved"
                    ? "Onaylandı"
                    : item.status === "rejected"
                    ? "Reddedildi"
                    : "Beklemede"}
                </span>
              </td>

              {isAdmin && (
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="approve-btn"
                      onClick={() =>
                        updateAppointmentStatus(item._id, "approved")
                      }
                      disabled={item.status === "approved"}
                    >
                      Onayla
                    </button>

                    <button
                      type="button"
                      className="reject-btn"
                      onClick={() =>
                        updateAppointmentStatus(item._id, "rejected")
                      }
                      disabled={item.status === "rejected"}
                    >
                      Reddet
                    </button>

                    <button
                      type="button"
                      className="edit-btn"
                      onClick={() => startEditAppointment(item)}
                    >
                      Düzenle
                    </button>

                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => deleteAppointment(item._id)}
                    >
                      Sil
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>


      {visibleAppointments.length > visibleCount && (
        <button
          type="button"
          className="load-more-btn"
          onClick={() => setVisibleCount((prev) => prev + 10)}
        >
          Daha Fazla Göster
        </button>
      )}
    </div>
  );
}

export default Admin;