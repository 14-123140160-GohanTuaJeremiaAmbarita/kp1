import { FaChartBar, FaComments, FaUsers, FaDesktop, FaTicketAlt, FaTools } from "react-icons/fa";
import logo from "../../assets/logo voksel.png";

const menus = [
  { icon: <FaChartBar />,  text: "Dashboard" },
  { icon: <FaComments />,  text: "Chat" },
  { icon: <FaUsers />,     text: "Karyawan" },
  { icon: <FaDesktop />,   text: "Asset" },
  { icon: <FaTicketAlt />, text: "Ticket" },
  { icon: <FaTools />,     text: "Work Order" },
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
      <div className="sidebar-footer">© 2025 PT Voksel Electric Tbk</div>
    </aside>
  );
}