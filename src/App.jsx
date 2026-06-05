import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import CadastroHospede from "./pages/CadastroHospede";
import ListaHospedes from "./pages/ListaHospedes";

function RotaProtegida({ children }) {
  const token = localStorage.getItem("authToken");
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<RotaProtegida><Layout /></RotaProtegida>}>
          <Route index element={<Dashboard />} />
          <Route path="cadastro" element={<CadastroHospede />} />
          <Route path="hospedes" element={<ListaHospedes />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}