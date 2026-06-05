import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, UserPlus, Users } from "lucide-react";
import prefeituraLogo from "../assets/prefeitura-aracaju.png";
import assistenciaLogo from "../assets/assistencia-social.jfif";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  function fazerLogout() {
    localStorage.removeItem("authToken");
    navigate("/login");
  }

  const linkStyle = {
    textDecoration: "none",
    color: "var(--ink)"
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <img src={prefeituraLogo} alt="Prefeitura de Aracaju" />
          <img src={assistenciaLogo} alt="Assistência Social" />
        </div>
        <div className="header-title">
          <span>Casa de Passagem Freitas Brandão</span>
          <h1>Sistema de Gestão</h1>
        </div>
        <div className="actions-right">
            <button className="ghost-button compact-button" onClick={fazerLogout}>Sair</button>
        </div>
      </header>

      <main className="workspace">
        <aside className="sidebar">
          <section className="side-panel">
            <nav className="steps">
              <Link to="/" className={`step-item ${location.pathname === "/" ? "active" : ""}`} style={linkStyle}>
                <span><LayoutDashboard size={20} strokeWidth={2.5} /></span>
                Dashboard
              </Link>
              <Link to="/cadastro" className={`step-item ${location.pathname === "/cadastro" ? "active" : ""}`} style={linkStyle}>
                <span><UserPlus size={20} strokeWidth={2.5} /></span>
                Novo Hóspede
              </Link>
              <Link to="/hospedes" className={`step-item ${location.pathname === "/hospedes" ? "active" : ""}`} style={linkStyle}>
                <span><Users size={20} strokeWidth={2.5} /></span>
                Lista de Hóspedes
              </Link>
            </nav>
          </section>
        </aside>

        <section className="content-area">
          <Outlet />
        </section>

      </main>
    </div>
  );
}