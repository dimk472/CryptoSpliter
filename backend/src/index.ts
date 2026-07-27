import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import eventsRouter, { contactsRouter } from "./routes/events";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      "https://cryptosplitter.app", // ← χωρίς / στο τέλος
      process.env.FRONTEND_URL ?? "",
    ].filter(Boolean),
  }),
);

// ✅ Ανεβάσαμε το limit από το default (100kb) σε 2mb, γιατί οι επαφές
// στέλνουν τη φωτογραφία προφίλ σαν base64 data URL μέσα στο JSON body.
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
  res.send("CryptoSplitter backend running 🚀");
});

app.use("/events", eventsRouter);
app.use("/contacts", contactsRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
