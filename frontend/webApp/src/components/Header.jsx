import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header style={{ padding: 12, borderBottom: "1px solid #ccc" }}>
      <h2>Digital Wardrobe</h2>

      <nav style={{ display: "flex", gap: 12 }}>
        <Link to="/">Landing</Link>
        <Link to="/auth">Log in / Sign up</Link>
        <Link to="/onboarding">Onboarding</Link>
        <Link to="/dashboarding">Dashboarding</Link>
      </nav>
    </header>
  );
}
