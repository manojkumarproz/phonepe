require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const crypto = require("crypto");
const app = express();

app.use(cors());
// app.use(express.json());

const PORT = process.env.PORT || 5001;

const client = StandardCheckoutClient.getInstance(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  1,
  Env.SANDBOX // change to PRODUCTION later
);

const BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";


/* ======================
   GET TOKEN
====================== */
async function getToken() {
  const body = new URLSearchParams({
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    client_version: 1,
    grant_type: "client_credentials",
  });

  const res = await axios.post(
    "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token",
    body.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return res.data.access_token;
}


/* ======================
   CREATE PAYMENT
====================== */
app.post("/api/pay", async (req, res) => {
  try {
    const token = await getToken();   // ✅ FIXED

    const merchantOrderId = "ORD" + Date.now();
    

    const response = await axios.post(
      `${BASE_URL}/checkout/v2/pay`,
      {
        merchantOrderId,
        amount: 1000,
        paymentFlow: {
          type: "PG_CHECKOUT",
          message: "test payment",
          merchantUrls: {
            redirectUrl: "http://localhost:5173/success",
          }
        },
      },
      {
        headers: {
          Authorization: `O-Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    

    res.json({ url: response.data.redirectUrl });

  } catch (err) {
    console.log("ERROR:", err.response?.data || err.message);
    res.status(500).send("Payment failed");
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);

/* ======================
   WEBHOOK (MANUAL VERIFY)
====================== */
app.post("/api/webhook", express.text({ type: "*/*" }), (req, res) => {
  console.log("🔥🔥 WEBHOOK HIT 🔥🔥");

  try {
    console.log("try block");
    
    const receivedAuth = req.headers["authorization"];
    console.log("Auth:", receivedAuth);
    const rawBody = req.body;

    console.log("Raw body:", rawBody);

    /* ---------- VERIFY AUTH ---------- */
    const expectedHash = crypto
      .createHash("sha256")
      .update(`${process.env.WEBHOOK_USER}:${process.env.WEBHOOK_PASS}`)
      .digest("hex");
    console.log("Expected hash:", expectedHash);
    const expectedHeader = `SHA256(${expectedHash})`;
console.log("expectedHeader:", expectedHeader);

    if (receivedAuth !== expectedHeader) {
      console.log("❌ Invalid authorization");
      return res.status(401).send("Unauthorized");
    }

    console.log("✅ Auth verified");

    /* ---------- PARSE BODY ---------- */
    const data = JSON.parse(rawBody);

    const { event, payload } = data;

    console.log("Event:", event);
    console.log("Payload:", payload);

    /* ---------- HANDLE EVENTS ---------- */

    if (event === "checkout.order.completed") {
      console.log("💰 PAYMENT SUCCESS:", payload.merchantOrderId);
      // update DB → status = COMPLETED
    }

    if (event === "checkout.order.failed") {
      console.log("❌ PAYMENT FAILED:", payload.merchantOrderId);
      // update DB → status = FAILED
    }

    res.status(200).send("OK");

  } catch (err) {
    console.log("❌ Webhook error:", err.message);
    res.status(400).send("Invalid");
  }
});


app.use(express.json());

// app.post("/api/webhook", (req, res) => {
//   console.log("🔥🔥 WEBHOOK HIT 🔥🔥");
//   res.send("OK");
// });