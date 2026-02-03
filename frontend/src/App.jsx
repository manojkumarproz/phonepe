function App() {

  const payNow = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/pay`,
      {
        method: "POST",   // ✅ change here
        headers: {
          "Content-Type": "application/json",
        }
      }
    );

    const data = await res.json();

    window.location.href = data.url;
  };

  // success page
  if (window.location.pathname === "/success") {
    return (
      <div style={{ padding: 40 }}>
        <h2>✅ Payment Successful</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <button onClick={payNow}>Pay ₹10</button>
    </div>
  );
}

export default App;
