import ChatBox from "./components/ChatBox";

function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 20% 50%, #1e1b4b 0%, #0f172a 40%, #000d1a 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
      }}
    >
      <ChatBox />
    </div>
  );
}

export default App;