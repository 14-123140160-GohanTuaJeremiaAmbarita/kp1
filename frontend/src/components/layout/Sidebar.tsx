import { FaChartBar, FaComments } from "react-icons/fa";
import logo from "../../assets/logo voksel.png";

// Menu Karyawan, Asset, Ticket, dan Work Order dihapus dari sidebar.
// Semua kebutuhan data itu sudah bisa diakses lewat halaman Chat (AI Assistant)
// secara natural language, jadi halaman terpisah untuk masing-masing modul
// tidak diperlukan lagi untuk fokus demo KP.
const menus = [
  { icon: <FaChartBar />, text: "Dashboard" },
  { icon: <FaComments />, text: "Chat" },
];

interface Props {
  active: string;
  onSelect: (page: string) => void;
}

export default function Sidebar({ active, onSelect }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="Voksel" className="sidebar-logo-img" />
        <h2>Smart IT Assistant</h2>
        <p>PT Voksel Electric Tbk</p>
      </div>
      <div className="sidebar-menu">
        {menus.map((menu) => (
          <button
            key={menu.text}
            className={`sidebar-item ${active === menu.text ? "active" : ""}`}
            onClick={() => onSelect(menu.text)}
          >
            <span className="sidebar-icon">{menu.icon}</span>
            <span>{menu.text}</span>
          </button>
        ))}
      </div>
      <div className="sidebar-footer">© 2026 PT Voksel Electric Tbk</div>
    </aside>
  );
}