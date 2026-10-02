import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header>
      <Link className="brand" to="/" aria-label="Karachi Central Library home">
        <span className="brandMark" aria-hidden="true">
          KC
        </span>
        <span className="brandText">
          <strong>Karachi Central Library</strong>
          <span>Library management</span>
        </span>
      </Link>
    </header>
  );
}
