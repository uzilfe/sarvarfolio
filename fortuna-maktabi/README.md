# Fortuna Maktabi — veb-sayt

Huquq va diplomatiya yo'nalishidagi xususiy maktab uchun sayt va target reklama uchun landing sahifa.

| Sahifa | Manzil | Vazifasi |
| --- | --- | --- |
| Bosh sahifa | `/` | Maktab haqida to'liq ma'lumot |
| Ro'yxatdan o'tish | `/royxat/` | Target reklama uchun landing, ariza formasi bilan |
| Rahmat | `/rahmat/` | Ariza yuborilgandan keyin ochiladi (Meta Pixel `Lead` hodisasi shu yerda) |
| API | `/api/lead` | Arizani Telegram va Notion'ga yuboradi |

Framework yo'q: oddiy HTML/CSS/JS va Vercel'dagi bitta serverless funksiya. Build talab qilinmaydi.

## 1. Kontaktlar va narxlar

`assets/config.js` faylini tahrirlang: telefon, Telegram, Instagram, manzil, narxlar (o'zbek guruh, rus guruh, yotoqxona bilan), Meta Pixel ID.
Bo'sh qoldirilgan maydon saytda ko'rinmaydi.

## 2. Arizalar qayerga tushadi

Vercel → Project → Settings → Environment Variables bo'limiga qo'shing (kamida bittasi shart):

**Telegram (tavsiya etiladi: ariza darhol telefoningizga keladi)**

1. Telegram'da [@BotFather](https://t.me/BotFather) → `/newbot` → token oling.
2. Botni arizalar tushadigan guruhga qo'shing va guruhda biror xabar yozing.
3. Brauzerda `https://api.telegram.org/bot<TOKEN>/getUpdates` ni oching va `chat.id` ni toping (guruhlarda u `-100...` bilan boshlanadi).
4. Env: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

**Notion "👥 Fortuna Lidlar Bazasi"**

1. https://www.notion.so/my-integrations → yangi integratsiya → token oling.
2. Notion'da lidlar bazasini oching → `•••` → Connections → integratsiyani qo'shing.
3. Env: `NOTION_TOKEN`, `NOTION_DATABASE_ID=730b8b5ad9ae4affbd44cfa4e4411d75`.

Ariza bazaga `Manba = 🌐 Sayt/Forma`, `Status = 🆕 Yangi` bilan tushadi, UTM ma'lumotlari esa `Izoh` maydoniga yoziladi.

Env o'zgaruvchilarni qo'shgandan keyin **Redeploy** qiling.

## 3. Domen

Vercel → Project → Settings → Domains → domeningizni kiriting va Vercel ko'rsatgan DNS yozuvlarini (A yoki CNAME) domen sotib olingan joyda qo'shing.

## 4. Reklama havolalari

Har bir kampaniya va kreativ uchun UTM qo'shing. Shunda Telegram'da qaysi reklamadan kelgani ko'rinadi:

```
https://DOMEN/royxat/?utm_source=instagram&utm_campaign=qabul&utm_content=creative1
```

## Lokal ishga tushirish

```bash
npx vercel dev
```
