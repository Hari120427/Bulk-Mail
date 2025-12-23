const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
require("dotenv").config(); // Load environment variables

const app = express();
// CRITICAL FIX: Use the port Render assigns, or 5001 if local
const PORT = process.env.PORT || 5001;

/* -------------------- MIDDLEWARE -------------------- */
app.use(express.json());
app.use(cors());

let transporter = null;
let credData = null;

/* -------------------- MONGODB CONNECTION -------------------- */
console.log("🔄 Connecting to MongoDB...");

// CRITICAL FIX: Use environment variable for the connection string
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error("❌ Error: MONGO_URI environment variable is not set.");
} else {
  mongoose
    .connect(mongoURI, {
      serverSelectionTimeoutMS: 30000,
    })
    .then(async () => {
      console.log("✅ MongoDB connected successfully");
      await loadCredentials();
    })
    .catch((err) => {
      console.error("❌ MongoDB connection failed:", err.message);
    });
}

mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose runtime error:", err.message);
});

/* -------------------- SCHEMA -------------------- */
const credentialSchema = new mongoose.Schema(
  {
    user: String,
    pass: String,
  },
  { collection: "bulkmail" }
);

const Credential = mongoose.model("Credential", credentialSchema);

/* -------------------- LOAD EMAIL CREDENTIALS -------------------- */
async function loadCredentials() {
  try {
    console.log("🔄 Loading email credentials...");

    const data = await Credential.find().limit(1);
    if (!data.length) throw new Error("No credentials found");

    credData = data[0].toObject();

    console.log("✅ Credentials loaded:", {
      user: credData.user,
      pass: "***",
    });

    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: credData.user,
        pass: credData.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.verify();
    console.log("✅ Email transporter ready");
  } catch (err) {
    console.error("❌ Failed to load credentials:", err.message);
  }
}

/* -------------------- SEND MAIL -------------------- */
app.post("/sendmail", async (req, res) => {
  const { msg, emaillist } = req.body;

  if (!transporter) {
    return res.status(503).json({ message: "Email service not ready" });
  }

  const results = [];

  // Consider using Promise.all here for speed, but this loop works fine for now
  for (const email of emaillist) {
    try {
      await transporter.sendMail({
        from: `"Bulk Mail App" <${credData.user}>`,
        to: email,
        subject: "Bulk Mail",
        text: msg,
      });
      results.push({ email, status: "sent" });
    } catch (err) {
      results.push({ email, status: "failed", error: err.message });
    }
  }

  res.json({ success: true, results });
});

/* -------------------- START SERVER -------------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});