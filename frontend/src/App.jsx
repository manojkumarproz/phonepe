import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState(null);

  const payNow = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ advpriceid: 10 })
    });

    const data = await res.json();
    window.location.href = data.url;
  };

  // ✅ REAL verification
  useEffect(() => {
    if (window.location.pathname === "/success") {
      const orderId = new URLSearchParams(window.location.search).get("orderId");

      fetch(`${import.meta.env.VITE_API_URL}/api/order-status/${orderId}`)
        .then(res => res.json())
        .then(data => setStatus(data.paymentstatusname));
    }
  }, []);

  if (window.location.pathname === "/success") {
    return (
      <div style={{ padding: 40 }}>
        {status === "Success" && <h2>✅ Payment Successful</h2>}
        {status === "Failed" && <h2>❌ Payment Failed</h2>}
        {!status && <h2>⏳ Checking payment status...</h2>}
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
