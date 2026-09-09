import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Main from "./components/Main";
import Footer from "./components/Footer";

function App() {
  const branchName = "Clifton Branch";

  return (
    <div>
      <Header />
      <Sidebar />
      <Main branchName={branchName} />
      <Footer />
    </div>
  );
}

export default App;
