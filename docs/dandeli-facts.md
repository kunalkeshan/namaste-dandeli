# Dandeli facts — verified, and do-not-publish

Research for this site produced facts that survived checking **and facts that did
not**. Both are recorded here. The rejections matter more: without them a future
session re-researches the same ground and re-introduces the same wrong numbers.

Three agents on this project fabricated findings while presenting them confidently.
Every one was caught by an adversarial pass that re-checked claims against primary
sources with instructions to default to REFUTED when unconfirmed.

---

## ✅ Verified — safe to publish

| Fact                                                                                                                | Source                                                                                       |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Kali Tiger Reserve** is the current official name, renamed from Dandeli–Anshi by gazette notification Dec 2015    | Deccan Herald, Wikipedia. _Karnataka Tourism's own rafting page still says the old name_     |
| Rafting is **dam-release dependent, not rainfall dependent** — water is released from Supa Dam for power generation | Karnataka Tourism: trail length varies "depending on water release from the nearby Supa Dam" |
| Rafting window **October–June**, subject to dam flow and forest clearance                                           | Karnataka Tourism, verbatim                                                                  |
| Rapids are **Grade II–III**                                                                                         | Karnataka Tourism: "Class II to Class III rapids"                                            |
| Long rafting trail is **9–12 km**                                                                                   | Karnataka Tourism                                                                            |
| **Ganeshgudi** is the rafting hub                                                                                   | Karnataka Tourism                                                                            |
| **Four of India's nine hornbill species** are resident: Great Pied, Malabar Pied, Malabar Grey, Indian Grey         | Karnataka Tourism                                                                            |
| Syntheri Rocks is carved by the **Kaneri** river (not the Kali), ~300 ft, ₹50 entry                                 | confirmed on all three points                                                                |
| Jungle safari is **2 hours**, slots 6–8 AM and 4–6 PM                                                               | consistent across every source checked                                                       |
| Kali is **one of India's best-known black panther territories**                                                     | sources state it is the only tiger reserve reporting frequent sightings                      |
| Airport codes **HBX / IXG / GOI / GOX**; **Dabolim (GOI) is closer than Mopa (GOX)**                                | verified — many sites get this backwards                                                     |
| **Hubballi** and **Belagavi** are the official names (renamed 2014)                                                 | verified                                                                                     |

---

## ❌ REJECTED — do not publish

| Claim                                                   | Why it was rejected                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **"Goa Dabolim 130 km / 3 hr 23 min"**                  | **Fabricated.** Real figure ~135 km / **~2 hr**. A 3h23m estimate for 135 km implies 40 km/h on a national highway. The agent labelled it "[VERIFIED-MAPS]" |
| **"Goa Mopa ~3 hr 50 min"**                             | Same fabrication pattern. Sources give ~2h16m                                                                                                               |
| **"Karwar 2 hr 25 min"**                                | Time inflated by ~45 min; distance (104 km) was right                                                                                                       |
| **"~200 bird species recorded (Wikipedia)"**            | **The cited article contains no bird count at all.** Attribution invented                                                                                   |
| **"300+ bird species"**                                 | Higher than the evidence supports. Use **~270**                                                                                                             |
| **"Grade IV rapids"**                                   | Single unverified source. It is **II–III**                                                                                                                  |
| **"Place is closed or not here" on his Google listing** | **A misreading by me.** That is the label on Maps' own _Suggest an edit_ menu and appears on every listing. His profile is healthy                          |
| **`@astrojs/tailwind` is deprecated**                   | Not deprecated — it is the supported Tailwind-3 legacy path. The quote cited from Astro's docs does not appear on that page                                 |
| **Tiger reserve area as a precise figure**              | Sources genuinely conflict (1,345 km² vs ~815 km² for the core). Say "over 1,300 sq km" or omit                                                             |
| **Dudhsagar Falls as a simple Dandeli day trip**        | It is in Goa with tightly controlled access. High risk of misleading a customer                                                                             |

---

## ⚠️ Unverified — ask Irshad, do not publish meanwhile

- **Safari gate and fee** — Karnataka Tourism says Phansoli, ₹450/person; a commercial
  site says Kulgi, ₹600. Both gates exist. The 6–8 AM / 4–6 PM slots are well sourced.
- **The Alnavar–Dandeli DEMU train** — one source reports a relaunch in Feb 2026 to
  Ambewadi station. Unverified, and it would change his pickup business. Omit entirely.
- **All eight route distances** — none measured. They render as "Ask the fare".

---

## The rule this produced

**No distance, drive time, price or statistic ships until independently measured.**

Enforced in code: `src/content/routes.ts` types distances as `Confirmed<Distance>`, so
an unmeasured route has no number to render. See `docs/content-rules.md`.
