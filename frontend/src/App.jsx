import { Routes, Route, Link } from "react-router-dom";
import Publico from "./pages/Publico.jsx";
import Votacao from "./pages/Votacao.jsx";
import Anfitriao from "./pages/Anfitriao.jsx";

export default function App() {
  return (
    <div className="container">
      <header>
        <h1>Live Pulse</h1>
        <nav>
          <Link to="/">Público</Link>
          <Link to="/host">Anfitrião</Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Publico />} />
        <Route path="/votacao/:id" element={<Votacao />} />
        <Route path="/host" element={<Anfitriao />} />
      </Routes>
    </div>
  );
}
