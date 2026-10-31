import { Outlet, Route, Routes } from 'react-router';
import Navbar from './components/Navbar.jsx';
import { SessionRoute } from './components/RouteGuards.jsx';
import Home from './pages/Home.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import Register from './pages/Register.jsx';

function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-[1200px] px-10 py-10">
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<AppLayout />}>
        <Route element={<SessionRoute />}>
          <Route path="/home" element={<Home />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
