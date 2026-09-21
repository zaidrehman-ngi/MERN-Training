import { Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import Home from "./routes/Home";
import Books from "./routes/Books";
import Users from "./routes/Users";
import BorrowRequests from "./routes/BorrowRequests";
import NotFound from "./routes/NotFound";
import AddBook from "./pages/AddBook/AddBook";
import BookDetail from "./routes/BookDetail";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />

        <Route path="/books">
          <Route index element={<Books />} />
          <Route path="add" element={<AddBook />} />
          <Route path=":id" element={<BookDetail />} />
        </Route>

        <Route path="/users" element={<Users />} />
        <Route path="/borrow-requests" element={<BorrowRequests />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
