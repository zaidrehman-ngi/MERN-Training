import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/index.css";
import "./styles/tokens.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { SocketProvider } from "./context/SocketProvider";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <StrictMode>
      <SocketProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SocketProvider>
    </StrictMode>
  </Provider>,
);
