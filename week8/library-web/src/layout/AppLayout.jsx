import { Outlet } from "react-router-dom";
import Header from "./Header";
import Navbar from "../components/Navbar/Navbar";
import LiveNotices from "../components/LiveNotices/LiveNotices";

function AppLayout() {
  return (
    <>
      <Header />
      <Navbar />
      <Outlet />
      <LiveNotices />
    </>
  );
}

export default AppLayout;
