import { Routes, Route } from "react-router-dom";
import Header from "./components/Header.jsx";

function Landing() {
  return <h1>Landing Page</h1>;
}

function Auth() {
  return <h1>Log in/Sign up Page</h1>;
}

function Onboarding() {
  return <h1>Onboarding Page</h1>;
}

function Dashboarding() {
  return <h1>Dashboarding Page</h1>;
}

export default function App() {
  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboarding" element={<Dashboarding />} />
      </Routes>
    </>
  );
}
