MODEX.UZ V2
============

Nimalar qo‘shildi:
- Katalog/kategoriyalar
- Mahsulot qidiruvi va narx bo‘yicha saralash
- Har mahsulot uchun alohida target link: product.html?id=ID
- UTM source/campaign/content ni buyurtmaga yozish
- Yordam xizmati formasi
- Super Admin panel
- Adminning operator yaratishi (Supabase Edge Function orqali)
- Operator panel: ism, familiya, telefon, viloyat, manzil, izoh, status
- QR etiketka: QR ichida telefon yo‘q; maxsus tokenli order.html sahifasi ochiladi
- Operatorni bloklash/faollashtirish

O‘RNATISH TARTIBI
1) Supabase -> SQL Editor ga kiring va setup_v2.sql ni to‘liq Run qiling.
2) Supabase -> Authentication -> Users dan o‘zingizning admin user UUID sini oling.
3) setup_v2.sql oxiridagi admin qilish SQL misolidagi YOUR_AUTH_USER_UUID ni o‘zingiznikiga almashtirib alohida Run qiling.
4) Supabase Dashboard'da public sign-up ni o‘chirib qo‘ying (operatorlarni faqat admin yaratishi uchun).
5) Supabase CLI orqali create-operator Edge Function ni deploy qiling:
   supabase functions deploy create-operator
   (SUPABASE_URL, SUPABASE_ANON_KEY va SUPABASE_SERVICE_ROLE_KEY secretlari server tarafda bo‘lishi kerak.)
6) Ushbu papkadagi HTML/CSS/JS fayllarni GitHub Pages repoga yuklang.

TARGET LINK MISOLI
https://SIZNING-DOMEN/product.html?id=25&utm_source=instagram&utm_campaign=qizlar_kiyimi

QR
Operator "QR etiketka" tugmasini bosadi. Etiketkada ism/familiya, viloyat va QR chiqadi.
QR skan qilinganda order.html?t=... ochiladi va telefon raqami ko‘rinadi.

XAVFSIZLIK
- config.js ichidagi publishable/anon key brauzerda bo‘lishi normal; maxfiy SERVICE_ROLE keyni hech qachon GitHub yoki browser JS ga qo‘ymang.
- SERVICE_ROLE faqat Supabase Edge Function secretida turadi.
