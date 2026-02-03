require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const crypto = require("crypto");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

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
    console.log("response:", response.data);
    

    res.json({ url: response.data.redirectUrl });

  } catch (err) {
    console.log("ERROR:", err.response?.data || err.message);
    res.status(500).send("Payment failed");
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);

function verifySignature(body, receivedSignature) {
  const checksum = crypto
    .createHmac("sha256", process.env.CLIENT_SECRET)
    .update(JSON.stringify(body))
    .digest("hex");

  return checksum === receivedSignature;
}

/* ======================
   WEBHOOK
====================== */
app.post("/api/webhook", express.json(), (req, res) => {
  const signature = req.headers["x-verify"] || "";
  
if (!signature || !verifySignature(req.body, signature)) {
  return res.status(400).send("Invalid signature");
}

  if (!verifySignature(req.body, signature)) {
    return res.status(400).send("Invalid signature");
  }

  console.log("✅ Signature verified");

  const { merchantOrderId, state } = req.body;

  if (state === "COMPLETED") {
    console.log("Payment success:", merchantOrderId);
  }

  res.status(200).send("OK");
});
