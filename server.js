import express from "express";
import cors from "cors";
import helmet from "helmet";

const app = express();

const PORT = process.env.PORT || 10000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;

app.use(helmet());
app.use(express.json({ limit: "20kb" }));

app.use(cors({
  origin(origin, callback) {
    if (!origin || origin === FRONTEND_ORIGIN) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed"));
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "telegram-lead-backend"
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

function cleanText(value, max = 80) {
  if (typeof value !== "string") return "";

  return value
    .trim()
    .replace(/[<>]/g, "")
    .slice(0, max);
}

app.post("/lead", async (req, res) => {
  try {
    const name = cleanText(req.body?.name, 60);
    const phone = cleanText(req.body?.phone, 30);
    const stage = cleanText(
      req.body?.stage || "step1_completed",
      40
    );

    if (name.length < 3 || phone.length < 7) {
      return res.status(400).json({
        ok: false,
        error: "Invalid lead data"
      });
    }

    const message = [
      "🟣 New Demo Lead",
      "",
      `👤 Name: ${name}`,
      `📱 Phone: ${phone}`,
      `📍 Stage: ${stage}`,
      `🕒 Time: ${new Date().toISOString()}`
    ].join("\n");

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message
        })
      }
    );

    if (!telegramResponse.ok) {
      return res.status(502).json({
        ok: false,
        error: "Telegram send failed"
      });
    }

    return res.json({
      ok: true
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      error: "Server error"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
