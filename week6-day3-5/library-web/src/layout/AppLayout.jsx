import { Outlet } from "react-router-dom";
import Header from "./Header";
import Navbar from "../components/Navbar/Navbar";

function AppLayout() {
  return (
    <>
      <Header />
      <Navbar />
      <Outlet />
    </>
  );
}

export default AppLayout;
