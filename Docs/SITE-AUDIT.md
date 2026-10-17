# us24solutions.com — site audit (crawl of 2026-10-15)

## What the live site is

- WordPress 7.1.3 on Hostinger (PHP 8.1, LiteSpeed cache). Theme: Blocksy + Blocksy Companion Pro.
- Page builder: **Elementor 3.11.2 (February 2023)** with ElementsKit, Essential Addons, Sina Extension and a
  Themesflat slider. Also Contact Form 7, Rank Math, Site Kit 1.94.0, LiteSpeed Cache.
- **67 pages, 1 blog post** (December 2021). The Blog page is empty.
- Seven service lines, each a hub page with child pages:

| Line | Hub | Child pages |
|---|---|---|
| Revenue Cycle Management | /revenue-cycle-management/ | 10 (+2 unlinked: /coding/, /medical-billing-professional-services/) |
| Cyber Security | /cyber-security-solutions/ | 10 |
| Salesforce CRM | /salesforce-crm/ | 6 |
| Salesforce Cloud | /salesforce-cloud/ | 10 |
| Web & App Development | /web-app-development/ | 7 |
| Accounting & Payroll | /accounting-payroll/ | 3 |
| Standalone | /devops/, /digital-marketing/, /laptop-repair-software-services/ | — |

Company pages: Home, About, Contact, Careers, CSR, Our Services, Blog, Privacy Policy, Terms & Conditions, Legal.

## Problems found

### Contact details disagree with each other

| | Contact page, header, footer (newest) | Home, About, Careers, 5 hub pages, Digital Marketing, Terms |
|---|---|---|
| US phone | +1 315-979-5075 | +1-309-364-6427 |
| India office | H-159, Sector 63, Noida | 1st Floor, 20/7 Block-J, New Alipore, Kolkata |
| India phone | +91 89206 62009 | +91-945-929-5272 |
| Email | info@us24solutions.com | contact@us24solutions.com |

The Noida PIN code is 201301 on the Contact page and 201309 in the footer.
**New site:** one set of details (the Contact page's), stored once in Settings → US24 Site and used everywhere.

### Claims that contradict each other

- Experience: **"05+ Years"** (home counter) vs **"10+ years"** (About). The 3D hero said "10+ years in RCM";
  its badge now reads "3 global delivery centres" until you confirm the number.
- Trial: the heading says **30–90 days**, the paragraph under it says **30-day**. The new copy says 30–90 days.
- The header shows a **Great Place to Work badge for Oct 2022 – Oct 2023**, which has expired. Not carried over.
- Footer: "Copyright © 2021". The new footer uses the current year automatically.

### Text that appears to be copied, or is wrong for the page

- **Salesforce Financial Services Cloud** matches cloudanalogy.com almost word for word: theirs reads
  "Since 2015, Cloud Analogy has been assisting financial advisors, wealth managers, and retail banks…", ours reads
  "Since 2018, US24 Solutions has…". Four Salesforce pages also used an image file named
  `2nd-img-of-why-cloudanalogy-min.png`.
- **Medical Billing Professional Services** (/medical-billing-professional-services/, not linked from the menu) says
  "At Revele, we're finding new ways…" and describes Revele's ScoreCard product. **Imported as a draft.**
- **Laptop Repair** contains an internal drafting note ("this service page can naturally extend your existing
  technology portfolio") under a heading that reads "Invoice Processing".
- **Android App Development** is headed "Salesforce App Development Agency"; **iOS** calls US24 "a top-tier Salesforce
  app development agency".
- **Application Security** repeats the Security Intelligence Threat Modeling text instead of describing application security.
- **Salesforce Cloud** hub: the card descriptions belong to other pages (the Commerce Cloud card describes Admin & Developer Support).
- **Our Services**: every service appears twice, and the "Digital Marketing" card links to Cyber Security.
- Older RCM and security pages still use the former name "US24 Healthcare" / "US24 HEALTHCARE SOLUTIONS".

### Thin or orphaned pages

- Salesforce Health Cloud and Salesforce Sales Cloud have about 20 words each.
- /coding/ is a 90-word duplicate of Medical Coding Services. Consider a 301 redirect.
- The Blog page is empty; the only post is from 2021.

### SEO and accessibility

- "Meet Our Team" (About) links to **/meet-our-team/, which returns 404**.
- 10 cyber pages share the meta description "Security is always excessive untill it's not enough." (with the typo);
  5 hub pages share "Avail US24 Solution's world-class and high-quality services…".
- Almost no images have alt text; partner logos are images with no names in text.
- Typos: "Recievable" (headings and the menu), "untill", "Cheif Technology Officer", "CAHQ" (CAQH).
- About a dozen pages use clip art from pngwing.com (unclear licence) and stock illustrations.

### Maintenance

- Elementor 3.11.2 is more than three years old. Elementor has shipped many security fixes since; update it, or
  retire it with this migration.

## What the WordPress rebuild changes

Kept as written: page URLs, page titles, all body copy, lists, the price table, team, testimonials, stats, legal text.

Changed:
1. One design for every page, taken from `US24 3D Hero.html`. The home page opens with the interactive 3D city.
2. Contact details unified (table above), editable in one place.
3. Spelling fixed; "US24 Healthcare" → "US24 Solutions" (except on Legal/Privacy/Terms, which keep their original wording).
4. Wrong headings fixed (Laptop Repair, Android), the drafting note removed, the 404 button removed,
   hub cards now show each target page's own summary, duplicate cards and repeated list items removed.
5. Every page has its own meta description (155 characters, no duplicates except the two pages that share text).
6. Images: clip art and stock dropped; team photos, ISO/HIPAA marks, RCM diagram, CSR graphic, laptop photo and the
   healthcare marketing portfolio kept, all with alt text. Logo walls became named "pills" (18 EHR/PM systems, 8 security tools).
7. Each service page ends with links to its sibling services. Hubs and the home page end with the quote form and offices.
8. The Medical Billing Professional Services page is a draft until it is rewritten.

Pages that still need an editor are flagged in WordPress (Pages → "Review" column) and in Tools → US24 Import.

## 3D hero: claims checked against the site

| Hero text | Source on the live site | Status |
|---|---|---|
| ISO 9001:2015, HIPAA compliant | About ("We Are ISO Certified Company", "We are HIPAA Compliant") | kept |
| 10+ years in RCM | About says 10+, home says 05+ | replaced by "3 global delivery centres" |
| 99% claims paid | Home / Our Services cards | kept |
| Up to 20% lower cost to collect, up to 5% more net patient revenue | RCM page "The results will amaze you" | kept |
| 30–90 day risk-free trial | Home | kept |
| Floors: front end / mid-cycle / back end / credentialing | End-to-End RCM page "RCM disciplines" | kept; floor lists now use the exact disciplines |
| eClinicalWorks, Epic, athenahealth, Kareo, AdvancedMD, Cerner, NextGen, Allscripts | RCM page logo wall | kept |
| EDI, ERA and EFT enrollment; CAQH profile | Provider Enrollment & Credentialing page | kept |
| Proprietary robotic process automation | About ("purpose-built, proprietary robotic process automation") | kept |
| Monthly analytics | not on the site | replaced: the technology annex now represents the IT services lines |
| Offices Chicago, Uxbridge, Noida | Contact page, footer | kept |

Each info card in the hero now links to the matching page (e.g. Floor 2 → Medical Coding Services).
