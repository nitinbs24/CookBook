import { Outlet, Route, Routes } from 'react-router';
import Navbar from './components/Navbar.jsx';
import { AdminRoute, ProtectedRoute, SessionRoute } from './components/RouteGuards.jsx';
import Admin from './pages/Admin.jsx';
import Category from './pages/Category.jsx';
import Home from './pages/Home.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import { MyRecipes, WantToTry } from './pages/MyLists.jsx';
import NotFound from './pages/NotFound.jsx';
import RecipeDetail from './pages/RecipeDetail.jsx';
import RecipeForm from './pages/RecipeForm.jsx';
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
        <Route path="/category/:slug" element={<Category />} />
        <Route path="/recipes/:id" element={<RecipeDetail />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/recipes/new" element={<RecipeForm />} />
          <Route path="/recipes/:id/edit" element={<RecipeForm />} />
          <Route path="/me/recipes" element={<MyRecipes />} />
          <Route path="/me/likes" element={<WantToTry />} />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<Admin />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
