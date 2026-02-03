require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { StandardCheckoutClient, Env } = require("pg-sdk-node");
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
   WEBHOOK (SDK BASED)
====================== */
app.post("/api/webhook", express.text({ type: "*/*" }), (req, res) => {
console.log("🔥🔥 WEBHOOK HIT 🔥🔥");
  try {
    console.log("from try block");
    
    const authorizationHeader = req.headers["authorization"];
    console.log("Authorization Header:", authorizationHeader);
    
    const responseBodyString = req.body; // raw string
    console.log("Request Body:", responseBodyString);
console.log("user", process.env.WEBHOOK_USER);
console.log("pass", process.env.WEBHOOK_PASS);

    const callbackResponse = client.validateCallback(
      process.env.WEBHOOK_USER,   // username from dashboard
      process.env.WEBHOOK_PASS,   // password from dashboard
      authorizationHeader,
      responseBodyString
    );

    console.log("✅ Callback verified:", callbackResponse);

    const { orderId, state, amount } = callbackResponse.payload;

    if (state === "COMPLETED") {
      console.log("💰 Payment success:", orderId, amount);
      // 👉 update DB here
    }

    if (state === "FAILED") {
      console.log("❌ Payment failed:", orderId);
    }

    res.status(200).send("OK");

  } catch (err) {
    console.log("❌ Invalid callback:", err.message);
    res.status(400).send("Invalid");
  }
});


app.use(express.json());

// app.post("/api/webhook", (req, res) => {
//   console.log("🔥🔥 WEBHOOK HIT 🔥🔥");
//   res.send("OK");
// });