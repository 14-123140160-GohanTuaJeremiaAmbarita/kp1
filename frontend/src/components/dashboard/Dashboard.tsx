import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { saveAs } from "file-saver";

interface Stats {
  totalKaryawan:      number;
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

const BLUE = [
  "#003B73","#005BAC","#1E6BB8","#2E86C1",
  "#4A90D9","#6CB4EE","#A8C8F0","#D0E8F8",
  "#0D3B66","#145DA0","#1F7AC5","#3A9BD5",
];

export default function Dashboard() {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [query]=useState("karyawan");

useEffect(()=>{

fetch("http://localhost:5000/api/dashboard/stats")

.then(r=>r.json())

.then(data=>{

setStats(data);

setLoading(false);

})

.catch(()=>{

setError(true);

setLoading(false);

});

},[]);

const downloadFile=async(

type:"excel"|"pdf"

)=>{

try{

const response=await fetch(

`http://localhost:5000/api/export/${type}?q=${encodeURIComponent(query)}`

);

if(!response.ok){

throw new Error();

}

const blob=await response.blob();

saveAs(

blob,

type==="excel"

?"Report.xlsx"

:"Report.pdf"

);

}

catch{

alert("Export gagal.");

}

};

  useEffect(() => {
    fetch("http://localhost:5000/api/dashboard/stats")
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-spinner" />
      <p>Memuat dashboard...</p>
    </div>
  );

  if (error || !stats) return (
    <div className="dash-loading">
      <p>❌ Gagal memuat. Pastikan backend berjalan di port 5000.</p>
    </div>
  );

  return (
    <div className="dashboard">

      {/* STAT CARDS */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon blue">👥</div>
          <div>
            <p className="stat-label">Total Karyawan</p>
            <h3 className="stat-value">{stats.totalKaryawan}</h3>
          </div>
        </div>
        <div className="dashboard-toolbar">

    <button

className="btn-export excel"

onClick={()=>downloadFile("excel")}

>

📊 Export Excel

</button>

<button

className="btn-export pdf"

onClick={()=>downloadFile("pdf")}

>

📄 Export PDF

</button>

        </div>
        <div className="stat-card">
          <div className="stat-icon orange">🎫</div>
          <div>
            <p className="stat-label">Total Tiket</p>
            <h3 className="stat-value">{stats.totalTicket}</h3>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🔧</div>
          <div>
            <p className="stat-label">Work Order</p>
            <h3 className="stat-value">{stats.totalWO}</h3>
            <p className="stat-sub">
              Open: {stats.woByStatus.find(w => w.name === "Open")?.value ?? 0}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">🖥️</div>
          <div>
            <p className="stat-label">Total Aset</p>
            <h3 className="stat-value">{stats.totalAsset}</h3>
          </div>
        </div>
      </div>

      {/* ROW 1 — Bar dept + Pie WO status */}
      <div className="chart-row">
        <div className="chart-card span2">
          <h4 className="chart-title">Karyawan per Departemen (Top 10)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={stats.karyawanByDeptTop10}
              margin={{ top: 5, right: 10, left: -20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#003B73" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4 className="chart-title">Status Work Order</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={stats.woByStatus}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={85}
                paddingAngle={3} dataKey="value"
              >
                {stats.woByStatus.map((_, i) => <Cell key={i} fill={BLUE[i]} />)}
              </Pie>
              <Tooltip formatter={(val) => [`${val}`, "Jumlah"]} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 2 — Pie tiket + Bar WO type */}
      <div className="chart-row">
        <div className="chart-card">
          <h4 className="chart-title">Tiket vs Work Order</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={stats.ticketByStatus}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={85}
                paddingAngle={3} dataKey="value"
              >
                {stats.ticketByStatus.map((_, i) => <Cell key={i} fill={BLUE[i]} />)}
              </Pie>
              <Tooltip formatter={(val) => [`${val}`, "Jumlah"]} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card span2">
          <h4 className="chart-title">Work Order per Jenis</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={stats.woByType}
              margin={{ top: 5, right: 10, left: -20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#005BAC" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROW 3 — Pie semua dept + Pie status karyawan */}
      <div className="chart-row" style={{ gridTemplateColumns: "1fr 1fr" }}>

        <div className="chart-card">
          <h4 className="chart-title">Distribusi Karyawan per Departemen</h4>
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie
                data={stats.karyawanByDept}
                cx="50%" cy="50%"
                outerRadius={120}
                dataKey="total"
                nameKey="name"
                label={({ name, percent }) => {

                  const p = percent ?? 0;

                  return p > 0.03
                    ? `${name} ${(p * 100).toFixed(0)}%`
                    : "";

                  }}
                labelLine={true}
              >
                {stats.karyawanByDept.map((_, i) => (
                  <Cell key={i} fill={BLUE[i % BLUE.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => [`${val} orang`, "Jumlah"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4 className="chart-title">Status Karyawan</h4>
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie
                data={stats.karyawanByStatus}
                cx="50%" cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {stats.karyawanByStatus.map((_, i) => (
                  <Cell key={i} fill={BLUE[i % BLUE.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => [`${val} orang`, "Jumlah"]} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

    </div>
  );
}