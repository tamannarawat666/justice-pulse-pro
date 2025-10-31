import mongoose from "mongoose";

const HearingSchema = new mongoose.Schema({
  caseTitle: { type: String, required: true },
  caseNumber: { type: String, default: "N/A" },
  judgeName: { type: String, default: "Not Assigned" },
  date: { type: String, required: true },
  nextHearingDate: { type: String, default: null },
  time: { type: String, required: true },
  court: { type: String, default: "Court details pending" },
  status: { type: String, default: "Upcoming" },
  type: { type: String, default: "Hearing" },
  userEmail: { type: String, required: true },  // ✅ Email field
  phonenumber: { type: String, required: true }, // ✅ Phone (used later)
});

const Hearing = mongoose.model("Hearing", HearingSchema);
export default Hearing;
