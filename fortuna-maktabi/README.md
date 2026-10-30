# Fortuna Maktabi — veb-sayt

Bo'lajak yurist va diplomatlar maktabi uchun sayt va target reklama uchun landing sahifa.

| Sahifa | Manzil | Vazifasi |
| --- | --- | --- |
| Bosh sahifa | `/` | Maktab haqida to'liq ma'lumot |
| Ro'yxatdan o'tish | `/royxat/` | Target reklama uchun landing, ariza formasi bilan |
| Rahmat | `/rahmat/` | Ariza yuborilgandan keyin ochiladi (Meta Pixel `Lead` hodisasi shu yerda) |
| API | `/api/lead` | Arizani Fortuna botiga uzatadi |

Framework yo'q: oddiy HTML/CSS/JS va Vercel'dagi bitta serverless funksiya. Build talab qilinmaydi.

## Arizalar qayerga tushadi

```
Sayt formasi → /api/lead (sayt) → fortuna-bot /api/site-lead → amoCRM + adminlar guruhi
```

Bot arizani amoCRM'ga o'quvchining sinfiga mos menejer voronkasiga, "Sayt" tegi bilan yozadi
va adminlar guruhiga karta yuboradi. Mijoz CRM'da allaqachon bo'lsa, yangi lid ochilmaydi,
mavjud lidiga izoh qo'shiladi.

### Sozlash

1. Uzun tasodifiy maxfiy so'z o'ylab toping (masalan, parol generatori bilan 40 belgi).
2. **fortuna-bot** Vercel loyihasi → Settings → Environment Variables: `SITE_LEAD_SECRET` = shu so'z → Redeploy.
3. **Sayt** Vercel loyihasi → Settings → Environment Variables: `SITE_LEAD_SECRET` = xuddi shu so'z → Redeploy.
4. Ixtiyoriy: bot boshqa manzilda bo'lsa, saytga `BOT_LEAD_URL=https://<bot-domen>/api/site-lead`.

Bot ishlamay qolsa, forma foydalanuvchiga xato va telefon raqamni ko'rsatadi,
ariza esa sayt loyihasining Vercel loglarida (`[lead] Botga yetkazilmadi`) to'liq saqlanadi.

## Kontaktlar va narxlar

`assets/config.js` faylini tahrirlang: telefonlar, Telegram, Instagram, manzil,
narxlar (o'zbek guruh, rus guruh, yotoqxona bilan), Meta Pixel ID.
Bo'sh qoldirilgan maydon saytda ko'rinmaydi.

## Vercel'ga joylash va domen

1. vercel.com → Add New → Project → `uzilfe/sarvarfolio` → **Root Directory**: `fortuna-maktabi` → Deploy.
2. Settings → Domains → domeningizni kiriting va Vercel ko'rsatgan DNS yozuvlarini domen sotib olingan joyda qo'shing.

## Reklama havolalari

Har bir kampaniya va kreativ uchun UTM qo'shing. Shunda amoCRM va guruhdagi kartada qaysi reklamadan kelgani ko'rinadi:

```
https://DOMEN/royxat/?utm_source=instagram&utm_campaign=qabul&utm_content=creative1
```
