const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const app = express();
// PORT: Render gives a port, otherwise use 5001 locally
const PORT = process.env.PORT || 5001;

/* -------------------- MIDDLEWARE -------------------- */
app.use(express.json());
app.use(cors());

let transporter = null;
let credData = null;

/* -------------------- MONGODB CONNECTION -------------------- */
console.log("🔄 Connecting to MongoDB...");

// MAGIC LINE: Uses Render's secret if available, otherwise uses your hardcoded link
const mongoURI = process.env.MONGO_URI || "mongodb+srv://Hari:Hari123@cluster0.csaqusk.mongodb.net/passkey";

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

/* -------------------- SCHEMA -------------------- */
const credentialSchema = new mongoose.Schema(
  { user: String, pass: String },
  { collection: "bulkmail" }
);
const Credential = mongoose.model("Credential", credentialSchema);

/* -------------------- LOAD CREDENTIALS -------------------- */
async function loadCredentials() {
  try {
    const data = await Credential.findOne();
    if (!data) throw new Error("No credentials found");

    credData = data.toObject();

    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: credData.user, pass: credData.pass },
      tls: { rejectUnauthorized: false },
    });

    await transporter.verify();
    console.log(`✅ Mail Service Ready: ${credData.user}`);
  } catch (err) {
    console.error("❌ Credential Error:", err.message);
  }
}

/* -------------------- SEND MAIL ROUTE -------------------- */
app.post("/sendmail", async (req, res) => {
  if (!transporter) return res.status(503).json({ message: "Service not ready" });

  const { msg, emaillist } = req.body;
  const results = [];

  for (const email of emaillist) {
    try {
      await transporter.sendMail({
        from: `"Bulk Mail" <${credData.user}>`,
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