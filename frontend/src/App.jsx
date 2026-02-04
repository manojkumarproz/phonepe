import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState(null);

  const API = import.meta.env.VITE_API_URL;

  /* ======================
     PAY NOW
  ====================== */
  const payNow = async () => {
    const res = await fetch(`${API}/api/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true", // ✅ VERY IMPORTANT
      },
      body: JSON.stringify({ advpriceid: 10 }),
    });

    const data = await res.json();

    window.location.href = data.url;
  };

  /* ======================
     CHECK PAYMENT STATUS
  ====================== */
  useEffect(() => {
    if (window.location.pathname === "/success") {
      const orderId = new URLSearchParams(window.location.search).get("orderId");

      const checkStatus = async () => {
        const res = await fetch(`${API}/api/order-status/${orderId}`, {
          headers: {
            "ngrok-skip-browser-warning": "true", // ✅ VERY IMPORTANT
          },
        });

        const data = await res.json();
        setStatus(data.paymentstatusname);
      };

      checkStatus();
    }
  }, []);

  /* ======================
     SUCCESS PAGE
  ====================== */
  if (window.location.pathname === "/success") {
    return (
      <div style={{ padding: 40 }}>
        {status === "Success" && <h2>✅ Payment Successful</h2>}
        {status === "Failed" && <h2>❌ Payment Failed</h2>}
        {!status && <h2>⏳ Checking payment status...</h2>}
      </div>
    );
  }

  /* ======================
     HOME PAGE
  ====================== */
  return (
    <div style={{ padding: 40 }}>
      <button onClick={payNow}>Pay ₹10</button>
    </div>
  );
}

export default App;
