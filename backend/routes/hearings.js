import express from "express";
import Hearing from "../models/Hearing.js";
import nodemailer from "nodemailer";
import cron from "node-cron";
import dotenv from "dotenv";

// Load .env for this module
dotenv.config();

const router = express.Router();

// -------------------- Nodemailer Setup --------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,       // your Gmail
    pass: process.env.EMAIL_PASS,       // 16-char App Password
  },
});

// Verify transporter at startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Email transporter ready");
  }
});

// -------------------- Add Hearing --------------------
router.post("/add", async (req, res) => {
  try {
    const { caseTitle, date, time, court, userEmail, phonenumber, type } = req.body;

    if (!caseTitle || !date || !time || !userEmail || !phonenumber) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newHearing = new Hearing({
      caseTitle,
      date,
      time,
      court: court || "Court details pending",
      type: type || "Hearing",
      userEmail,
      phonenumber,
    });

    await newHearing.save();
    console.log("✅ Hearing saved:", newHearing);

    // Send email
    const mailOptions = {
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
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("❌ Email sending failed:", err);
      } else {
        console.log(`📧 Email sent to ${userEmail}:`, info.response);
      }
    });

    res.status(201).json({
      message: "✅ Hearing added successfully",
      hearing: newHearing,
    });
  } catch (err) {
    console.error("❌ Error adding hearing:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
