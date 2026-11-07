# 🎀 Birthday Surprise Website - Setup, Supabase & Render Guide ✨

Yeh website 100% ready hai! Isme do sabse important cheezein add kar di gayi hain:
1. **View-Only (Non-Editable) Mode**: Birthday girl ke liye saare edit, delete, add photo, reset buttons completely hide ho jayenge. Unhe sirf ek polished, magical surprise dikhega!
2. **Supabase Cloud Sync**: Aapki photos, custom GIF, letter aur yaadein Supabase cloud me save hongi, taaki jab aap website ko **Render** pe host karke link bhejoge, toh unke phone me bhi saari photos aur GIF ekdum smoothly load hongi!

---

## 🔒 1. Non-Editable (View-Only) Mode Kaise Kaam Karta Hai?

Jab aap website apne browser me khologe, toh upar ek **Admin Bar** dikhega:
- **`👁️ Birthday Girl View Check Kijiye` Button**: Is par click karke aap dekh sakte ho ki unhe website bina kisi edit button ke kaisi dikhegi.
- **`🔗 Shareable Link Copy Kijiye` Button**: Is par click karne se ek clean link copy hota hai (jisme `?view=1` laga hota hai, jaise `https://your-site.onrender.com/?view=1`).
- Jab wo yeh link kholengi:
  - Upar ka Admin Bar gayab ho jayega.
  - Saare Edit buttons, Delete buttons, Add Photo buttons, Replace buttons, aur Reset buttons automatically **gayab** ho jayenge.
  - Wo sirf surprise enjoy karengi: cake candles bujhana, polaroids dekhna, letter kholna, gaana sunna aur patakhe phodna!

---

## ☁️ 2. Supabase Kaise Connect Karein? (Sirf 2 Minute Ka Kaam)

Supabase ek free database aur storage provider hai. Isse photos aur GIF cloud me save ho jayengi.

### Step 1: Free Account & Project Banaiye
1. [supabase.com](https://supabase.com) par jaiye aur free account banakar **"New Project"** par click kijiye.
2. Koi bhi project name dijiye (jaise `birthday-surprise`) aur ek password set karke project create kijiye.

### Step 2: Database Setup (1 Click)
1. Supabase Dashboard ke left menu me **SQL Editor** par click kijiye.
2. `E:\jm-birthday\supabase_setup.sql` file ka poora code copy karke wahan paste kijiye aur **RUN** par click kijiye.
3. Isse saare tables aur `birthday-media` storage bucket ek second me taiyar ho jayenge!

### Step 3: API Keys Paste Kijiye
1. Supabase me left menu me **Project Settings** (gear icon) > **API** par jaiye.
2. Wahan se:
   - **Project URL** copy kijiye
   - **Project API keys** ke andar se **`anon public`** key copy kijiye
3. `E:\jm-birthday\supabase-config.js` file kholiye aur wahan paste kar dijiye:
   ```javascript
   const SUPABASE_CONFIG = {
     url: 'https://xyzcompany.supabase.co', // Aapka Project URL
     anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', // Aapki Anon Key
     bucketName: 'birthday-media'
   };
   ```
4. Save kijiye! Ab website open karne par upar status dikhega: **`☁️ Supabase Cloud: Connected & Synced ✅`**.
   Aap jo bhi photos, GIF, aur wishes add karoge, wo direct Supabase cloud me store ho jayengi!

---

## 🚀 3. Render Par Free Host Kaise Karein?

Render par static site host karna free aur super easy hai:

### Option A: GitHub Se (Recommended)
1. Apne GitHub account par ek private ya public repo banaiye (jaise `jm-birthday`).
2. `E:\jm-birthday` ke saare files us repo me upload / push kar dijiye.
3. [render.com](https://render.com) par login kijiye > **New +** > **Static Site**.
4. Apni repo connect kijiye.
5. Settings:
   - **Name**: `jm-birthday` (ya jo aap chahein)
   - **Publish directory**: `.` (dot / root)
6. **Create Static Site** par click kijiye. 1 minute me aapko link mil jayega (jaise `https://jm-birthday.onrender.com`).

### Option B: Netlify Drop (Subah-Sham bina GitHub ke, Direct Drag & Drop)
Agar GitHub use nahi karna:
1. [app.netlify.com/drop](https://app.netlify.com/drop) par jaiye.
2. `E:\jm-birthday` folder ko direct wahan drag-and-drop kar dijiye.
3. 5 second me site live ho jayegi aur link mil jayega!

---

## 🎁 4. Unhe Bhejne Ka Tarika:
Jab aap site live kar lo aur photos/GIF set kar lo:
Upar diye **`🔗 Shareable Link Copy Kijiye`** button par click kijiye, aur wo link unhe WhatsApp/Instagram pe bhej dijiye!
Link aisa hoga:
`https://your-site.onrender.com/?view=1`
(Isme koi bhi edit button unhe nahi dikhega!)
