import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Navbar from "../components/Navbar/Navbar";

function AppLayout() {
  return (
    <>
      <Header />
      <Navbar />
      <Sidebar />

      <Outlet />
    </>
  );
}

export default AppLayout;
