Excelent — un mecanism de referral bine gândit pentru ContractGuardAi poate genera creștere exponențială cu cost aproape zero, mai ales în bull market (unde viralitatea contează mai mult decât ads plătite).

Mai jos ai un plan complet de sistem de referral adaptat pentru o aplicație SaaS crypto/AI ca a ta — cu flux UX, recompense, antifraudă, formule de calcul și implementare tehnică (Next.js + Neon + Stack Auth).

⸻

🧭 1️⃣ Obiectivul

Transformăm fiecare utilizator într-un promotor al ContractGuardAi.

🎯 Scopuri:
•	Creșterea rapidă a user base-ului organic (word-of-mouth).
•	Recompensarea celor care aduc utilizatori activi reali (nu doar conturi fake).
•	Creșterea retenției (ambii participanți câștigă beneficii concrete).

⸻

💡 2️⃣ Concept: „Refer & Protect”

Slogan:

“Ajută-ți prietenii să nu fie păcăliți — și primești mai multe scanări gratuite!”

⸻

⚙️ 3️⃣ Mecanismul de bază

Element	Descriere
Cod unic de referral	Generat automat pentru fiecare utilizator (user.referral_code = "CG-" + nanoid(6))
Link partajabil	https://contractguard.ai/ref/{referral_code}
Recompensă pentru Invitat (Referrer)	+5 scanuri extra / +3 zile Pro Trial / 10% reducere abonament
Recompensă pentru Noul Utilizator (Referred)	3 scanuri suplimentare gratuite la înscriere / 7 zile Pro Trial
Bonus suplimentar	Dacă invitatul devine Pro → referrer primește 20% credit sau 1 lună Pro
Limitare antifraudă	Max 10 invitații/zi; IP + email + device fingerprint check


⸻

🧠 4️⃣ Exemple de recompense posibile

Tip de recompensă	Ideal pentru	Exemplu concret
Credit în scanări	Utilizatori free	“+5 free scans for every friend who signs up”
Perioadă Pro gratuită	Freelanceri / investitori activi	“1 friend = +3 zile Pro”
Discount la abonament	Utilizatori Pro	“20% off next month for each active referral”
Affiliate payout (Pro plan)	Influenceri crypto	“30% revenue share per paid user (via Stripe Connect)”


⸻

🔄 5️⃣ Flux UX complet

🧩 Etapa 1 — Generare cod

După sign-up (în dashboard):

Invite your friends and earn rewards 🔥
Your link: contractguard.ai/ref/CG-A12B9C
→ Copy Link / Share on Twitter / Telegram / Discord

🧩 Etapa 2 — Noul utilizator accesează linkul
1.	Ajunge pe pagina /ref/[code]
2.	Mesaj:
“👋 You were invited by @Gabriel to try ContractGuardAi — get +3 free scans!”
3.	La sign-up, referred_by este salvat în DB.

🧩 Etapa 3 — Când invitatul devine activ
•	După 1 audit complet → se marchează „Referral Confirmed”.
•	Referrer primește automat bonus (scanări sau credit).
•	Email: “🔥 Congrats! You earned +5 scans because Ana joined with your link.”

⸻

🧮 6️⃣ Schema în Neon (simplificată)

alter table users add column referral_code text unique;
alter table users add column referred_by text references users(referral_code);

create table referrals (
id uuid primary key default gen_random_uuid(),
referrer_id uuid references users(id),
referred_id uuid references users(id),
status text default 'pending', -- pending, confirmed, rewarded
reward_type text, -- scans, trial, discount
created_at timestamptz default now(),
confirmed_at timestamptz
);


⸻

⚙️ 7️⃣ Lógica backend (pseudocod Next.js route handler)

// /api/referrals/confirm.ts
import { db } from "@/lib/db";

export async function POST(req) {
const { referredUserId } = await req.json();
const referral = await db.referrals.findFirst({ where: { referred_id: referredUserId } });

if (referral && referral.status === "pending") {
await db.referrals.update({
where: { id: referral.id },
data: { status: "confirmed", confirmed_at: new Date() },
});

    // Apply reward
    await db.users.update({
      where: { id: referral.referrer_id },
      data: { scans_today: { increment: 5 } },
    });

    sendEmail(referral.referrer_id, "You earned +5 free scans!");
}

return Response.json({ success: true });
}


⸻

🎨 8️⃣ UI Components

Referral Banner (Dashboard)

<div className="p-4 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-2xl text-white shadow-lg">
  <h3 className="font-semibold">Invite friends, earn rewards 💎</h3>
  <p className="text-sm opacity-90">
    Get +5 free scans for every friend who joins — they also get +3 free scans!
  </p>
  <div className="flex mt-3 items-center gap-2">
    <input
      value={`https://contractguard.ai/ref/${user.referral_code}`}
      readOnly
      className="bg-white/10 text-xs px-2 py-1 rounded-lg w-full border border-white/20"
    />
    <button className="bg-white text-blue-700 font-semibold px-3 py-1 rounded-lg">
      Copy
    </button>
  </div>
</div>


⸻

🧩 9️⃣ Antifraudă

Mecanism	Implementare
IP check	salvează IP în referrals și blochează duplicate
Device fingerprint	stocare fingerprint anonim (localStorage hash)
Email domain filter	blochează domenii temporare (tempmail, yopmail etc.)
Rate limiting	max 10 invitații/zi / user
Stripe validation	bonus doar dacă invitatul devine Pro real


⸻

💰 10️⃣ Scenarii de scalare

Nivel	Descriere	Beneficiu
Base	Free users → primesc extra scans	Crește activarea
Affiliate Pro	Influenceri / Pro users → 30% din vânzările aduse	Crește conversia la plată
Leaderboard (Gamification)	Top referrers = premii lunare (NFT badge / 1 an Pro)	Crește viralitatea


⸻

📈 11️⃣ KPI de urmărit

Indicator	Țintă
Invite-to-signup rate	15–25%
Referral confirmation rate	10–15%
Referral-to-paid conversion	3–5%
Cost per acquired user (CPA)	< €2
Virality Coefficient (K)	≥ 1.2 (fiecare user aduce >1 nou user)


⸻

🧠 12️⃣ Variante creative (pentru bull market)
1.	“Saved from Rug Pull” challenge — utilizatorii primesc puncte pentru prieteni salvați.
2.	“Top Guardians” leaderboard — cei cu cele mai multe invitații primesc NFT badge „Rug Slayer”.
3.	“Referral Drops” — lunar, distribuie tokeni fictivi (Guard Points) ce pot fi convertiți în zile Pro.
4.	“Social Proof Campaign” — afișează în UI:
“🔥 328 new traders joined via invites this week.”

⸻
