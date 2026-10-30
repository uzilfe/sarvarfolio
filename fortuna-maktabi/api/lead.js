/*
 * POST /api/lead — saytdagi ariza formasini qabul qiladi va Fortuna botiga uzatadi.
 * Bot arizani amoCRM'ga (sinfiga mos menejerga) yozadi va adminlar guruhiga karta yuboradi.
 *
 * Vercel env:
 *   SITE_LEAD_SECRET — botdagi bilan bir xil maxfiy kalit (majburiy)
 *   BOT_LEAD_URL     — ixtiyoriy, standart: https://fortuna-bot.vercel.app/api/site-lead
 */

const ROLES = ["Ota-ona", "O'quvchi"];
const GRADES = ["8-sinf", "9-sinf", "10-sinf", "11-sinf"];
const LANGUAGES = ["O'zbek", "Rus"];
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const DEFAULT_BOT_URL = "https://fortuna-bot.vercel.app/api/site-lead";

function clean(value, max) {
  return String(value == null ? "" : value).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

function parseLead(body) {
  if (!body || typeof body !== "object") return { error: "bad_request" };

  const name = clean(body.name, 80);
  const digits = String(body.phone || "").replace(/\D/g, "");
  const role = clean(body.role, 20);
  const grade = clean(body.grade, 20);
  const language = clean(body.language, 20);

  if (name.length < 2) return { error: "name" };
  if (!/^998\d{9}$/.test(digits)) return { error: "phone" };
  if (!ROLES.includes(role)) return { error: "role" };
  if (!GRADES.includes(grade)) return { error: "grade" };
  if (language && !LANGUAGES.includes(language)) return { error: "language" };

  const utm = {};
  if (body.utm && typeof body.utm === "object") {
    for (const k of UTM_KEYS) if (body.utm[k]) utm[k] = clean(body.utm[k], 200);
  }

  return {
    lead: {
      name, phone: "+" + digits, role, grade, language,
      dorm: body.dorm === true, utm, page: clean(body.page, 100)
    }
  };
}

async function sendToBot(lead) {
  const secret = process.env.SITE_LEAD_SECRET;
  if (!secret) throw new Error("SITE_LEAD_SECRET sozlanmagan");
  const r = await fetch(process.env.BOT_LEAD_URL || DEFAULT_BOT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-site-secret": secret },
    body: JSON.stringify(lead),
    signal: AbortSignal.timeout(25000)
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.ok) throw new Error(`bot ${r.status}: ${JSON.stringify(data).slice(0, 200)}`);
  return data;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }

  // Honeypot: bot to'ldirgan bo'lsa, jim qabul qilamiz va hech qayerga yubormaymiz
  if (body && body.website) return res.status(200).json({ ok: true });

  const { lead, error } = parseLead(body);
  if (error) return res.status(400).json({ ok: false, error });

  try {
    await sendToBot(lead);
    return res.status(200).json({ ok: true });
  } catch (e) {
    // Ariza yo'qolmasin: Vercel loglarida to'liq qoladi
    console.error("[lead] Botga yetkazilmadi:", e.message, JSON.stringify(lead));
    return res.status(502).json({ ok: false, error: "delivery_failed" });
  }
};

module.exports.parseLead = parseLead;
