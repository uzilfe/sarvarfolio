/*
 * POST /api/lead — saytdagi ariza formasini qabul qiladi.
 *
 * Ariza quyidagi joylarga yuboriladi (qaysi biri sozlangan bo'lsa):
 *   1) Telegram: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
 *   2) Notion "Fortuna Lidlar Bazasi": NOTION_TOKEN + NOTION_DATABASE_ID
 *
 * Kamida bittasi muvaffaqiyatli bo'lsa, foydalanuvchiga "ok" qaytadi.
 */

const ROLES = ["Ota-ona", "O'quvchi"];
const GRADES = ["8-sinf", "9-sinf", "10-sinf", "11-sinf"];
const LANGUAGES = ["O'zbek", "Rus"];
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"];

function clean(value, max) {
  return String(value == null ? "" : value).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function tashkentNow() {
  // Toshkent vaqti (UTC+5), ISO formatda
  const d = new Date(Date.now() + 5 * 60 * 60 * 1000);
  return d.toISOString().replace("Z", "+05:00").replace(/\.\d{3}/, "");
}

function parseLead(body) {
  if (!body || typeof body !== "object") return { error: "bad_request" };

  const name = clean(body.name, 80);
  const digits = String(body.phone || "").replace(/\D/g, "");
  const role = clean(body.role, 20);
  const grade = clean(body.grade, 20);

  if (name.length < 2) return { error: "name" };
  if (!/^998\d{9}$/.test(digits)) return { error: "phone" };
  if (!ROLES.includes(role)) return { error: "role" };
  if (!GRADES.includes(grade)) return { error: "grade" };
  const language = clean(body.language, 20);
  if (language && !LANGUAGES.includes(language)) return { error: "language" };
  const dorm = body.dorm === true;

  const utm = {};
  if (body.utm && typeof body.utm === "object") {
    for (const k of UTM_KEYS) if (body.utm[k]) utm[k] = clean(body.utm[k], 200);
  }

  const phone = `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
  return { lead: { name, phone, role, grade, language, dorm, utm, page: clean(body.page, 100) } };
}

function sourceLabel(utm) {
  const s = (utm.utm_source || "").toLowerCase();
  if (s.includes("insta") || s === "ig") return "Instagram";
  if (s.includes("face") || s === "fb" || utm.fbclid) return "Facebook";
  if (s.includes("tele") || s === "tg") return "Telegram";
  return utm.utm_source || "Sayt";
}

async function sendTelegram(lead) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return "skipped";

  const lines = [
    "🆕 <b>Yangi ariza — Fortuna Maktabi</b>",
    " ",
    `👤 <b>Ism:</b> ${escapeHtml(lead.name)}`,
    `📞 <b>Telefon:</b> ${escapeHtml(lead.phone)}`,
    `🙋 <b>Kim:</b> ${escapeHtml(lead.role)}`,
    `🎓 <b>Sinf:</b> ${escapeHtml(lead.grade)}`,
    lead.language && `🗣 <b>Til:</b> ${escapeHtml(lead.language)} guruh`,
    lead.dorm && "🏠 <b>Yotoqxona kerak</b> (viloyatdan)",
    `📍 <b>Manba:</b> ${escapeHtml(sourceLabel(lead.utm))}`
  ].filter(Boolean);
  if (lead.utm.utm_campaign) lines.push(`📢 <b>Kampaniya:</b> ${escapeHtml(lead.utm.utm_campaign)}`);
  if (lead.utm.utm_content) lines.push(`🎨 <b>Kreativ:</b> ${escapeHtml(lead.utm.utm_content)}`);

  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: lines.join("\n"), parse_mode: "HTML", disable_web_page_preview: true })
  });
  if (!r.ok) throw new Error(`telegram ${r.status}: ${await r.text()}`);
  return "sent";
}

async function sendNotion(lead) {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) return "skipped";

  const utmText = Object.keys(lead.utm).map((k) => `${k}=${lead.utm[k]}`).join(", ");
  const note = [
    lead.language && `Til: ${lead.language} guruh`,
    lead.dorm && "Yotoqxona kerak",
    `Manba: ${sourceLabel(lead.utm)}`, utmText, lead.page && `Sahifa: ${lead.page}`].filter(Boolean).join(" | ");

  const r = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: {
        "Ism": { title: [{ text: { content: lead.name } }] },
        "Telefon": { phone_number: lead.phone },
        "Auditoriya": { select: { name: lead.role } },
        "Sinf": { select: { name: lead.grade } },
        "Manba": { select: { name: "🌐 Sayt/Forma" } },
        "Status": { select: { name: "🆕 Yangi" } },
        "Sana": { date: { start: tashkentNow() } },
        "Izoh": { rich_text: [{ text: { content: note.slice(0, 1900) } }] }
      }
    })
  });
  if (!r.ok) throw new Error(`notion ${r.status}: ${await r.text()}`);
  return "sent";
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

  const results = await Promise.allSettled([sendTelegram(lead), sendNotion(lead)]);
  const sent = results.some((r) => r.status === "fulfilled" && r.value === "sent");
  results.forEach((r) => { if (r.status === "rejected") console.error("[lead]", r.reason && r.reason.message); });

  if (!sent) {
    const configured = results.some((r) => !(r.status === "fulfilled" && r.value === "skipped"));
    if (!configured) console.error("[lead] Hech qanday qabul qiluvchi sozlanmagan (TELEGRAM_* yoki NOTION_* env yo'q)");
    console.error("[lead] Yo'qolgan ariza:", JSON.stringify(lead));
    return res.status(502).json({ ok: false, error: "delivery_failed" });
  }

  return res.status(200).json({ ok: true });
};

module.exports.parseLead = parseLead;
