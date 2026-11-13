import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { restoreSession, selectAuthStatus } from "./store/authSlice";
import AppLayout from "./layout/AppLayout";
import Home from "./routes/Home";
import Books from "./routes/Books";
import Users from "./routes/Users";
import BorrowRequests from "./routes/BorrowRequests";
import NotFound from "./routes/NotFound";
import AddBook from "./pages/AddBook/AddBook";
import BookDetail from "./routes/BookDetail";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import RequireAuth from "./components/RequireAuth";
import { STAFF_ROLES } from "./constants/roles";

function App() {
  const dispatch = useDispatch();
  const authStatus = useSelector(selectAuthStatus);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  useEffect(() => {
    if (authStatus === "expired" && location.pathname !== "/login") {
      navigate("/login", {
        replace: true,
        state: { from: location.pathname + location.search, expired: true },
      });
    }
  }, [authStatus, location, navigate]);

  if (authStatus === "checking") {
    return <p role="status">Loading...</p>;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />

        <Route path="/books">
          <Route index element={<Books />} />
          <Route path=":id" element={<BookDetail />} />
          <Route element={<RequireAuth roles={STAFF_ROLES} />}>
            <Route path="add" element={<AddBook />} />
            <Route path=":id/edit" element={<AddBook />} />
          </Route>
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/borrow-requests" element={<BorrowRequests />} />
        </Route>

        <Route element={<RequireAuth roles={STAFF_ROLES} />}>
          <Route path="/users" element={<Users key="users" />} />
        </Route>

        <Route element={<RequireAuth roles={["super admin"]} />}>
          <Route path="/admins" element={<Users key="admins" adminsOnly />} />
        </Route>
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
