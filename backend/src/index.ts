import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import eventsRouter from "./routes/events";
import { contactsRouter } from "./routes/contacts";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://cryptosplitter.app",
  "https://www.cryptosplitter.app",
  process.env.FRONTEND_URL ?? "",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".cryptosplitter.app") ||
        origin.endsWith(".netlify.app")
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
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
