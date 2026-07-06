import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import eventsRouter from "./routes/events";

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

app.use(express.json());

app.get("/", (req, res) => {
  res.send("CryptoSplitter backend running 🚀");
});

app.use("/events", eventsRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
