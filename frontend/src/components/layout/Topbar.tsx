interface Props {
  activePage: string;
}

export default function Topbar({ activePage }: Props) {
  return (
    <header className="topbar">
      <div>
        <h1>{activePage === "Chat" ? "Smart IT Assistant" : activePage}</h1>
        <p>PT Voksel Electric Tbk</p>
      </div>
      <div className="topbar-right">
        <div className="status-online">
          <span className="online-dot" />
          Online
        </div>
      </div>
    </header>
  );
}