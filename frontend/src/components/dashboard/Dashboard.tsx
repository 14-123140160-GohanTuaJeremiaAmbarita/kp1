import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { saveAs } from "file-saver";

interface Stats {
  totalKaryawan:       number;
  totalTicket:        number;
  totalWO:            number;
  totalAsset:         number;
  karyawanByDept:     { name: string; total: number }[];
  karyawanByDeptTop10:{ name: string; total: number }[];
  karyawanByStatus:   { name: string; value: number }[];
  ticketByStatus:     { name: string; value: number }[];
  woByStatus:         { name: string; value: number }[];
  woByType:           { name: string; value: number }[];
}

const VOKSEL_BLUE_PALETTE = [
  "#003B73", "#005BAC", "#1E6BB8", "#2E86C1",
  "#4A90D9", "#6CB4EE", "#A8C8F0", "#0D3B66",
  "#145DA0", "#1F7AC5", "#3A9BD5"
];

// ==========================================
// KOMPONEN: DASHBOARD SKELETON PLACEHOLDER
// ==========================================
const DashboardSkeleton = () => (
  <div className="dashboard">
    <div className="dashboard-header-bar skeleton-pulse" style={{ height: '60px', borderRadius: '8px', marginBottom: '20px', background: '#E2E8F0' }}></div>
    <div className="stat-cards">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="stat-card skeleton-pulse" style={{ height: '100px', background: '#E2E8F0', borderRadius: '8px' }}></div>
      ))}
    </div>
    <div className="chart-row-full" style={{ marginTop: '20px' }}>
      <div className="chart-card large-view skeleton-pulse" style={{ height: '450px', background: '#E2E8F0', borderRadius: '8px' }}></div>
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  
  // State Filter Utama
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [selectedModule, setSelectedModule] = useState<string>("Employee"); 

  const handleDeptChange = (deptName: string) => {
    setLoading(true);
    setSelectedDept(deptName);
  };

  useEffect(() => {
    let active = true;
    let url = "http://localhost:5000/api/dashboard/stats";
    
    if (selectedDept !== "All") {
      url += `?department=${encodeURIComponent(selectedDept)}`;
    }

    // Fungsi pemanggil data terisolasi untuk mendukung Auto-Refresh
    const fetchData = (isInitial: boolean) => {
      if (isInitial) setLoading(true);
      
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error();
          return r.json();
        })
        .then((data) => {
          if (active) {
            setStats(data);
            setLoading(false);
            setError(false);
          }
        })
        .catch(() => {
          if (active) {
            setError(true);
            setLoading(false);
          }
        });
    };

    // Eksekusi muatan awal
    fetchData(true);

    // FITUR HEBAT 1: AUTO REFRESH DASHBOARD (Mengecek data baru setiap 30 detik tanpa kedip)
    const intervalId = setInterval(() => {
      fetchData(false); // isInitial = false mencegah skeleton menutupi layar berulang-ulang
    }, 30000);

    return () => {
      active = false;
      clearInterval(intervalId); // Mencegah kebocoran memori (memory leak)
    };
  }, [selectedDept]);

  const downloadFile = async (type: "excel" | "pdf") => {
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      let backendQuery = "karyawan"; 
      
      if (selectedModule === "Employee") backendQuery = "karyawan";
      else if (selectedModule === "Ticket") backendQuery = "ticket";
      else if (selectedModule === "WorkOrder") backendQuery = "workorder";
      else if (selectedModule === "Asset") backendQuery = "asset";

      const response = await fetch(
        `http://localhost:5000/api/export/${type}?q=${encodeURIComponent(backendQuery)}&dept=${encodeURIComponent(selectedDept)}`
      );
      
      if (!response.ok) throw new Error();
      
      const blob = await response.blob();
      const extension = type === "excel" ? "xlsx" : "pdf";
      
      // FITUR HEBAT 2: DYNAMIC FILE NAME BERDASARKAN FILTER KONTEKS
      saveAs(blob, `Voksel_${selectedModule}_Report_${selectedDept}_${timestamp}.${extension}`);
    } catch {
      alert(`Gagal memproses ekspor data ${selectedModule} ke format ${type.toUpperCase()}.`);
    }
  };

  // FITUR HEBAT 3: LOADING SKELETON ANIMATION UX
  if (loading && !stats) return <DashboardSkeleton />;

  if (error || !stats) return (
    <div className="dash-loading">
      <p>❌ Gagal memuat data. Pastikan service backend berjalan di port 5000.</p>
    </div>
  );

  return (
    <div className="dashboard">
      
      {/* TOOLBAR KONTROL BARU (Sangat Ringkas & Bersih) */}
      <div className="dashboard-header-bar">
        <div className="filter-controls-group">
          
          {/* Filter Divisi */}
          <div className="filter-item">
            <label htmlFor="dept-filter">Divisi / Departemen:</label>
            <select 
              id="dept-filter" 
              value={selectedDept} 
              onChange={(e) => handleDeptChange(e.target.value)}
              className="select-filter"
            >
              <option value="All">Semua Departemen</option>
              {stats.karyawanByDept.map((d, idx) => (
                <option key={idx} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Modul Data Ekspor */}
          <div className="filter-item">
            <label htmlFor="module-filter">Modul Laporan:</label>
            <select 
              id="module-filter" 
              value={selectedModule} 
              onChange={(e) => setSelectedModule(e.target.value)}
              className="select-filter"
            >
              <option value="Employee">👤 Data Karyawan</option>
              <option value="Ticket">🎫 Data Tiket Helpdesk</option>
              <option value="WorkOrder">🔧 Data Work Order</option>
              <option value="Asset">🖥️ Data Aset Komputer</option>
            </select>
          </div>

        </div>

        {/* Cukup Dua Tombol Utama Saja */}
        <div className="dashboard-toolbar">
          <button className="btn-export excel" onClick={() => downloadFile("excel")}>
            📊 Export Excel
          </button>
          <button className="btn-export pdf" onClick={() => downloadFile("pdf")}>
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* FITUR HEBAT 4: DRILL DOWN BADGE CONTEXT NOTICE */}
      {selectedDept !== "All" && (
        <div style={{ background: '#E6F4FF', border: '1px solid #91CAFF', padding: '10px 15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
          <div>
            <strong style={{ color: '#003B73' }}>🔍 Mode Drill-Down Aktif:</strong> Menampilkan sorotan data operasional ter-filter khusus Divisi <strong style={{ textTransform: 'uppercase' }}>{selectedDept}</strong>.
          </div>
          <button onClick={() => handleDeptChange("All")} style={{ background: '#FF4D4F', color: '#FFF', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Kembali ke Global
          </button>
        </div>
      )}

      {/* SUMMARY STATISTIC CARDS */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon blue">👥</div>
          <div className="stat-info">
            <p className="stat-label">Total Karyawan</p>
            <h3 className="stat-value">{stats.totalKaryawan}</h3>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon orange">🎫</div>
          <div className="stat-info">
            <p className="stat-label">Total Tiket</p>
            <h3 className="stat-value">{stats.totalTicket}</h3>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon green">🔧</div>
          <div className="stat-info">
            <p className="stat-label">Work Order</p>
            <h3 className="stat-value">{stats.totalWO}</h3>
            <p className="stat-sub">
              Open: {stats.woByStatus.find(w => w.name === "Open")?.value ?? 0}
            </p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon purple">🖥️</div>
          <div className="stat-info">
            <p className="stat-label">Total Aset</p>
            <h3 className="stat-value">{stats.totalAsset}</h3>
          </div>
        </div>
      </div>

      {/* ROW 1 — CHART SELURUH DIVISI (Highlight Mode Terintegrasi) */}
      <div className="chart-row-full">
        <div className="chart-card large-view">
          <h4 className="chart-title">
            {selectedDept !== "All" 
              ? `Analisis Sorotan Grafik: Fokus Utama Divisi ${selectedDept}` 
              : "Distribusi Karyawan Per Seluruh Divisi / Departemen PT Voksel"}
          </h4>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={stats.karyawanByDept}
              margin={{ top: 20, right: 30, left: 10, bottom: 130 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="grid-line" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fontWeight: "500" }} 
                angle={-45} 
                textAnchor="end" 
                interval={0} 
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend verticalAlign="top" height={40} iconType="square" />
              <Bar 
                name="Jumlah Anggota Karyawan Terdaftar"
                dataKey="total" 
                radius={[4, 4, 0, 0]} 
                onClick={(data) => {
                  if (data && data.name) handleDeptChange(data.name);
                }}
                style={{ cursor: 'pointer' }}
              >
                {stats.karyawanByDept.map((entry, index) => {
                  // FITUR VISUAL HIGHLIGHT: Jika filter aktif, beri warna kontras tajam pada divisi terpilih, sisanya abu-abu pudar
                  const isCurrentSelection = selectedDept !== "All"
                    ? entry.name.toLowerCase().trim().includes(selectedDept.toLowerCase().trim())
                    : false;

                  let barColor = VOKSEL_BLUE_PALETTE[index % VOKSEL_BLUE_PALETTE.length];
                  if (selectedDept !== "All") {
                    barColor = isCurrentSelection ? "#003B73" : "#D1D5DB";
                  }

                  return <Cell key={`cell-${index}`} fill={barColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 2 — PIE CHART: Tiket & Work Order */}
      <div className="chart-row split-view">
        <div className="chart-card">
          <h4 className="chart-title">Analisis Tiket Berdasarkan Status</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.ticketByStatus}
                cx="50%" cy="40%"
                innerRadius={65} outerRadius={95}
                paddingAngle={4} dataKey="value"
                nameKey="name"
              >
                {stats.ticketByStatus.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={VOKSEL_BLUE_PALETTE[i % VOKSEL_BLUE_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => [`${val} Tiket`, "Kuantitas"]} />
              <Legend iconType="circle" iconSize={10} layout="horizontal" align="center" verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4 className="chart-title">Analisis Work Order Berdasarkan Status</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.woByStatus}
                cx="50%" cy="40%"
                innerRadius={65} outerRadius={95}
                paddingAngle={4} dataKey="value"
                nameKey="name"
              >
                {stats.woByStatus.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={VOKSEL_BLUE_PALETTE[(i + 3) % VOKSEL_BLUE_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => [`${val} Berkas`, "Kuantitas"]} />
              <Legend iconType="circle" iconSize={10} layout="horizontal" align="center" verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 3 — BAR KLASIFIKASI & STATUS HUBUNGAN KERJA */}
      <div className="chart-row split-view">
        <div className="chart-card">
          <h4 className="chart-title">Klasifikasi Work Order (WO) Per Jenis</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={stats.woByType}
              margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="grid-line" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend verticalAlign="top" height={30} />
              <Bar name="Volume Distribusi WO" dataKey="value" radius={[4, 4, 0, 0]}>
                {stats.woByType.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={VOKSEL_BLUE_PALETTE[(index + 5) % VOKSEL_BLUE_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4 className="chart-title">Status Hubungan Kerja Karyawan</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.karyawanByStatus}
                cx="50%" cy="45%"
                innerRadius={0} outerRadius={95}
                dataKey="value" nameKey="name"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {stats.karyawanByStatus.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={VOKSEL_BLUE_PALETTE[(i + 1) % VOKSEL_BLUE_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => [`${val} Orang`, "Kuantitas"]} />
              <Legend iconType="circle" iconSize={10} layout="horizontal" align="center" verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}