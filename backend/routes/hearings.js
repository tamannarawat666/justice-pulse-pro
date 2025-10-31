import express from "express";
import Hearing from "../models/Hearing.js";
import nodemailer from "nodemailer";
import cron from "node-cron";

const router = express.Router();

// ✅ Email config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Add hearing route
router.post("/add", async (req, res) => {
  console.log("🔥 Incoming body:", req.body); // DEBUG

  try {
    const { caseTitle, date, time, court, userEmail, phonenumber, type } = req.body;

    // ✅ Validation (phonenumber required too)
    if (!caseTitle || !date || !time || !userEmail || !phonenumber) {
      return res.status(400).json({
        error: "Missing required fields (caseTitle, date, time, email, phone).",
        receivedBody: req.body,
      });
    }

    // ✅ DO NOT CHANGE DATE TYPE — keep it as string
    const newHearing = new Hearing({
      caseTitle,
      date,
      time,
      court: court || "Court details pending", // fallback
      type: type || "Hearing",
      userEmail,
      phonenumber,
    });

    await newHearing.save();
    console.log("✅ Hearing saved:", newHearing);

    // Send email if provided
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: `Court Hearing Reminder: ${caseTitle}`,
        html: `
          <h2>Court Hearing Reminder</h2>
          <p><strong>Case:</strong> ${caseTitle}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <p><strong>Court:</strong> ${court}</p>
        `,
      });

      console.log(`📧 Email sent to ${userEmail}`);
    } catch (emailErr) {
      console.error("❌ Email sending failed:", emailErr);
    }

    res.status(201).json({
      message: "✅ Hearing added successfully",
      hearing: newHearing,
    });

  } catch (err) {
    console.error("❌ Error adding hearing:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Fetch hearings
router.get("/", async (req, res) => {
  try {
    const hearings = await Hearing.find().sort({ date: 1 });
    res.json(hearings);
  } catch (err) {
    console.error("❌ Fetch Error:", err);
    res.status(500).json({ error: "Error fetching hearings" });
  }
});

export default router;
