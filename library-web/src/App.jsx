import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Home from "./routes/Home";
import Books from "./routes/Books";
import Users from "./routes/Users";
import BorrowRequests from "./routes/BorrowRequests";
import NotFound from "./routes/NotFound";
import AddBook from "./pages/AddBook/AddBook";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<Books />} />
        <Route path="/books/add" element={<AddBook />} />
        <Route path="/users" element={<Users />} />
        <Route path="/borrow-requests" element={<BorrowRequests />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
