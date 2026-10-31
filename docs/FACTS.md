# Rift Makers: fact sheet (code from this)

Owner: geography/gameplay QA helper. Checked on 31 October 2026 against the repo snapshots in `docs/curriculum/` **and** the live Workbook module JSON (`https://www.workbook.co.il/api/agent/content?subject=geography&grade=…&chapter=…&module=…&format=json`). The two match in their prose. **The snapshots leave out every table, comparison card and tip list**, though, so the layer table, plate-rate table, boundary-type table, Richter/Mercalli table, rock-group table and volcano table do not appear in `docs/curriculum/`. Facts that come only from those blocks are marked **(table, live only)**. Appendix A copies their key rows so the repo holds the evidence.

The game's rule constants must come from this file. A value marked **OURS** is a tuning or content choice we made and is not in the modules.

Module keys (all canonical URLs checked against `canonicalUrl` in the live JSON; they match the handoff links exactly):

| Key | Module | URL |
|---|---|---|
| ES | מבנה כדור הארץ | https://geography.workbook.co.il/grade-8/chapter-4/earth-structure |
| PT | טקטוניקת הלוחות | https://geography.workbook.co.il/grade-8/chapter-4/plate-tectonics |
| EV | רעידות אדמה והרי געש | https://geography.workbook.co.il/grade-8/chapter-4/earthquakes-volcanoes |
| RM | סלעים ומינרלים | https://geography.workbook.co.il/grade-8/chapter-4/rocks-minerals |
| WE | בליה, סחיפה והשקעה | https://geography.workbook.co.il/grade-8/chapter-5/weathering-erosion |
| LB | רצועות האורך | https://geography.workbook.co.il/grade-9/chapter-2/landform-belts |
| LD | מגוון נופים | https://geography.workbook.co.il/grade-9/chapter-2/landscape-diversity |

---

## §1. Earth's structure (ES)

**Layers (table "שכבות כדור הארץ - מבחוץ פנימה", live only).** The module gives these numbers. Use them for cutaway labels and probe readouts.

| Layer (Hebrew as written) | Depth/thickness | Temperature | State / note (module words) |
|---|---|---|---|
| קרום יבשתי | 30-70 ק"מ | עד 300 מעלות | "דק וקשה, בנוי מסלעים קלים יחסית" |
| קרום אוקייני | 5-10 ק"מ | עד 200 מעלות | "בנוי בעיקר מבזלת" |
| מעטפת עליונה | עד 700 ק"מ | 1,000-1,500 מעלות | "בה נמצאים הלוחות הטקטוניים ואזורי המגמה" |
| מעטפת תחתונה | 700-2,900 ק"מ | עד 3,000 מעלות | "לחץ אדיר, חומר **מוצק** למרות החום" |
| גלעין חיצוני | 2,900-5,100 ק"מ | 3,000-5,000 מעלות | "**נוזלי**, בנוי ברזל וניקל, מייצר שדה מגנטי" |
| גלעין פנימי | 5,100-6,370 ק"מ | 5,000-6,000 מעלות | "**מוצק** בגלל לחץ אדיר, בנוי ברזל וניקל" |

- Inner core: "הגלעין הפנימי מוצק בגלל לחץ עצום … גם בטמפרטורות גבוהות" and "הגלעין הפנימי - למרות שהוא חם יותר - מוצק".
- Gradient: "ככל שיורדים פנימה, הטמפרטורה והלחץ עולים".
- Heat sources: "חום שיורי מהיווצרות כדור הארץ לפני כ-4.5 מיליארד שנה" plus "פירוק רדיואקטיבי של יסודות כמו אורניום ותוריום".
- Magma and lava: "מגמה היא סלע מותך וזורם שנמצא בעיקר במעטפת"; "ההבדל בין מגמה ולבה הוא המיקום בלבד". The module also says magma "מזיזה לוחות" (see S9).
- Drilling: Kola reached "12.2 ק"מ" (the prose elsewhere says "כ-12 ק"מ"); continental crust "עבה בממוצע 35 ק"מ".

**Seismic waves: what the module actually says.** It uses only **"גלי הדף"** and **"סיסמוגרף"**. It never names P or S waves (I searched all 7 modules for גלי P / גלי S / ראשוניים / משניים).
- "רעידת אדמה יוצרת גלי הדף … כשגלים אלה עוברים בין שכבות שונות, הם מתכופפים ומשנים כיוון".
- "סיסמוגרף הוא מכשיר … ומקליט את הגלים הללו. כשמשווים את זמן הגעת הגלים …".
- Liquid outer core: "ישנם שני סוגים של גלים: גלים שיכולים לעבור דרך נוזל וגלים שאינם יכולים … אחד הסוגים אינו מגיע לצד השני מנקודות מסוימות. מסקנה: יש שכבה נוזלית בפנים שחוסמת אותם. זה הגלעין החיצוני."
- Rule for code: there are 2 wave types. Type B does not cross liquid, so stations on the far side, inside the "shadow", get type A only. If we label them P/S, that is **OURS** enrichment and must not be assessed. Hebrew in play: "גלי הדף מסוג א / מסוג ב", or "גל שעובר בנוזל / גל שנחסם בנוזל".

**Magnetic field.** "השדה נוצר בגלעין החיצוני הנוזלי, שבו זרמי ברזל וניקל נוזליים נעים ויוצרים זרם חשמלי"; it "מגן … מפני חלקיקים מזיקים מהשמש (הרוח הסולרית)".

**Internal vs. external processes**
- ES: "תהליכים פנימיים מונעים בכוחות שבתוך כדור הארץ, ויוצרים הרים, רעידות אדמה והרי געש. תהליכים חיצוניים מונעים בכוחות שמעל פני השטח, כמו מים ורוח, ושוחקים ומעצבים את הנוף."
- Comparison card: internal processes "מונעים בחום שבתוך כדור הארץ. בונים את הנוף", with examples "הרי האלפים, הרי הקווקז, הרי הגולן". External processes run on "מים, רוח, גלי ים, קרח. שוחקים", with examples "קניונים שנחצבו על ידי נהרות, חוליות שנוצרו מרוח".
- Israeli examples (ES thinking question): internal are "הרי הגולן הבזלתיים", "בקע הירדן"; external are "קניון הירדן שנחצב על ידי הנהר", "חוליות הנגב שנוצרו מרוח".
- ES callout: "הר גבוה מעיד שהתהליכים הפנימיים גוברים כרגע; עמק שנחצב מעיד על כוח שחיקה חזק".
- LB terms: "תהליך פנימי: … קימוט, שבירה וגעשיות"; "תהליך חיצוני: … בליה, סחיפה והשקעה".
- WE: "סדר חובה: בליה ← סחיפה ← השקעה. בלי בליה, אין חומר לסחוף." Also "בליה = פירוק במקום. סחיפה = תנועה."

## §2. Plate tectonics (PT)

**Motion and the engine**
- "הלוחות צפים על המעטפת החמה ונעים לאט מאוד, כמה סנטימטרים בשנה"; heading "היבשות זזות, לאט אבל בלי הפסקה".
- Convection: "תנועה מעגלית חוזרת זו נקראת **זרמי ערבול** (זרמי קונבקציה)"; plates "נגררים יחד עם זרם המעטפת". Use זרמי ערבול. The handoff is right on this.
- Why the plates are slow: "המעטפת, למרות החום, היא חומר צמיג מאוד שזורם לאיטו, לא נוזל רגיל … ולכן הם זזים בקצב של סנטימטרים בשנה".

**Rates.** The handoff's "2–7 cm/yr" is the table's note, not a hard limit.
- Note: "תנועה של 2-7 ס"מ בשנה נשמעת זניחה, אך במשך מיליוני שנים היא יכולה להזיז יבשות של אלפי קילומטרים".
- Table rows (live only): אפריקני 2-3 ס"מ; אינדו-אוסטרלי 5-7 ס"מ (Himalaya); נאזקה **7-8** ס"מ (Andes); ערבי **2-3 ס"מ** "מתרחק מהלוח האפריקני"; פסיפי **5-10** ס"מ.
- Atlantic: "אמריקה ואירופה מתרחקות זו מזו בכ-2.5 ס"מ בשנה. לפני כ-200 מיליון שנה הן היו מחוברות". A second line says the Atlantic formed "לפני כ-180 מיליון שנה".
- Code math: **1 cm/yr × 1 Myr = 10 km**, and **1 mm/yr × 1 Myr = 1 km**. As a check, 2.5 cm/yr × 200 Myr = 5,000 km, a believable Atlantic width.
- Level 6's "5 cm/yr" is **OURS**. It falls inside 2–7, but the module's own ocean-opening example is **2.5 cm/yr (Atlantic)**. Do not mark a student wrong for any rate in the table's range.

**Boundary types: exact Hebrew (table "שלושה סוגי גבולות בין לוחות", live only)**

| Module name | Motion | What happens | Landform | Example |
|---|---|---|---|---|
| **לוחות מתרחקים** | "הלוחות נעים זה מזה" | "מגמה עולה מהמעטפת ויוצרת קרקע חדשה" | "רכס מרכז-אוקיינוסי, בקעים" | "רכס האוקיינוס האטלנטי, **הבקע הסורי-אפריקני**" |
| **לוחות מתנגשים (יבשה ביבשה)** | "שני לוחות יבשתיים לוחצים זה על זה" | "הסלעים מקומטים ומורמים" | "רכסי הרים גבוהים" | "הימלאיה (הודו מתנגשת באסיה)" |
| **לוחות מתנגשים (אוקיינוס ביבשה)** | "לוח אוקייני שוקע תחת לוח יבשתי" | "שקיעה (סובדוקציה), מגמה נוצרת ופורצת" | "תהום אוקיינוסית, שרשרת הרי געש" | "האנדים, טבעת האש" |
| **לוחות מחליקים** | "הלוחות נעים זה לצד זה" | "חיכוך ומתח מצטבר" | "רעידות אדמה חזקות" | "שבר סן-אנדראס בקליפורניה" |

- Key-points list: "מתרחקים (בקע ורכסים), מתנגשים (הרים וסובדוקציה), מחליקים (רעידות)".
- **The handoff's "מתקרבים" does not appear anywhere. The module word is "מתנגשים".** "מחליקים זה לצד זה" is close; the module says "לוחות מחליקים" / "נעים זה לצד זה".
- Subduction: "לוחות אוקייניים בנויים בעיקר מבזלת, שהיא צפופה יחסית. לוחות יבשתיים בנויים מסלעים כמו גרניט, שהם קלים יותר"; "הנקודה שבה שוקע הלוח יוצרת תהום ים עמוקה"; chains "ביפן, בפיליפינים, בצ'ילה ובקליפורניה".
- Continent–continent with no volcanoes: the module **does not say this outright**. It lists volcanoes only for subduction and gives continent–continent as "מקומטים ומורמים" → mountains. Present it as "אין לוח ששוקע, ולכן לא נוצרת מגמה", which is an inference consistent with the module text.
- Himalaya and Appalachians: Himalaya "תהליך שנמשך עד היום. לכן הם ממשיכים לגדול"; Appalachians "נוצרו לפני כ-300 מיליון שנה … מאז פועלים עליהם רק תהליכי שחיקה חיצוניים". Note line: "הר גבוה ומחודד = פעיל עדיין. הר נמוך ועגול = עתיק ושחוק."
- Mid-Atlantic: "**רכס מרכז האטלנטי**. בו נוצרת קרקע אוקיינוסית חדשה כל הזמן, כשמגמה עולה ומתמצקת". Handoff term "רכס מרכז-אוקייני" ≠ module spellings "רכס מרכז-אוקיינוסי" / "רכס מרכז-האוקיינוס".
- Transform "offset features" (a river or road torn sideways) are **not in the modules**. The transform row gives only friction, stress and strong quakes. Level 9's offset river is OURS visualization, consistent with "נעים זה לצד זה".
- Sea-floor stripes: the modules never mention magnetic or basalt stripes. Use them as visuals only.

**Wegener** (PT, "חמש עדויות לנדידת היבשות")
- "בשנת 1912 … אלפרד וגנר … יבשת-על שקרא לה 'פנגאה'"; he died in 1930.
- Evidence, in order: (1) "התאמת קווי החוף" of South America and Africa; (2) "מאובנים זהים" – Mesosaurus in South America and Africa; (3) "סלעים זהים … שכבות סלע זהות בסוגן ובגילן"; (4) "אקלים שונה בעבר" – tropical fossils in Antarctica, glacier evidence in India; (5) "רצפת האוקיינוס צעירה מהיבשות" (see S1: the module states the age trend backwards).
- The critique: "הקהילה המדעית דחתה את הרעיון בתחילה, כי וגנר לא יכול היה להסביר מה מניע את היבשות." Its value: "הביקורת המדעית לא 'נגד' הרעיון שלו, אלא 'בעד' הצגת ראיות מספיקות … גילו את זרמי הערבול, ורק אז התקבלה התאוריה."
- Steps: "תצפית ← השערה ← ביקורת ← איסוף עדויות נוספות ← הסבר מנגנון ← מסקנה".
- Design consequence for L10: the critic's objection in the module is the **missing mechanism**, not a poor fit. The critic NPC should accept only after the fit plus the evidence **and** the mechanism (convection, shown as later evidence).

## §3. The Syrian-African rift (הבקע הסורי-אפריקני)

**Framing A, "moving apart"** (PT, ES, EV):
- PT callout: "ישראל נמצאת בדיוק על גבול בין הלוח הערבי לבין הלוח האפריקני. כשהלוחות האלה התרחקו זה מזה, נוצר שבר ענק … הבקע עדיין פעיל, הלוחות ממשיכים להתרחק".
- PT card: "עדיין פעיל: הלוחות מתרחקים בכ-**5-7 מ"מ לשנה**". Length "כ-6,000 ק"מ מטורקיה עד מוזמביק", width "עשרות קילומטרים".
- PT boundary table puts the rift under **לוחות מתרחקים**.
- ES: "שבר עמוק בקרום … שנוצר כאשר שני לוחות טקטוניים התרחקו זה מזה".
- EV: "הלוח הערבי מתרחק מהלוח האפריקני בכמה מ"מ בשנה". **But** EV also says "הלוח הערבי זז **צפון-מזרחה ביחס** ללוח האפריקני", which already hints at sideways motion.

**Framing B, "side by side and the ground sank"** (LB):
- "הבקע הוא קטע בשבר הסורי אפריקני, אזור שבו **שני לוחות נעים זה לצד זה והקרקע שביניהם צנחה**".
- "בבקע קרתה תנועה הפוכה, שבירה שהשקיעה את הקרקעית מאות מטרים".
- "בקע ים המלח נפער כשגוש הארץ נשבר לאורך השבר הסורי אפריקני". Its process label is "שבירה טקטונית".

**Shared facts**
- Contents: "הבקע הסורי בצפון, עמק הירדן, ים המלח, הערבה, מפרץ אילת" (PT); "אגם כנרת" (PT card); LB: "ממשיך צפונה אל הכנרת ודרומה אל מפרץ אילת".
- Golan linked to the rift: "כשהלוחות התרחקו, מגמה פרצה מהמעטפת ויצרה הרי געש" (PT).
- Future: "ייתכן שבעוד מיליוני שנים ים סוף ישתרע צפונה לאורך הירדן".

**Dead Sea depth**
- "כ-430 מטר מתחת לפני הים" (PT, ES); "יותר מ-430 מטרים מתחת לפני הים בשפת ים המלח, מפלס שממשיך לרדת בכמטר בכל שנה" (LB).
- Wording to use: "הנקודה הנמוכה ביותר ביבשה" (PT) / "הנקודה היבשתית הנמוכה בעולם" (LB).
- Relief range: Hermon spur "כ-2,236 מטרים" to −430 m "בתוך מרחק של כמאתיים קילומטר" (LB).

**1927 quake** (EV)
- "בעוצמה של כ-6.2 בסולם ריכטר, שהתרחשה בעמק הירדן הצפוני. 500 בני אדם נהרגו, ערים כמו **טבריה, יריחו ושכם** נפגעו קשות. המוקד היה ליד ים המלח. … החמורה ביותר שישראל חוותה במאה ה-20".
- Also given: "רעידת 749 לספירה" ≈7.0 (בית שאן, טבריה, ציפורי, עכו). The 413 high-risk areas are "עמק הירדן, בית שאן ואילת".
- Jerusalem is **not** named for 1927. The handoff's "retrofit Jerusalem" is OURS. Prefer the module's towns.

**Game model.** Plates slide past each other, with a small opening component and a sinking block between them. Each level's feedback quotes only the framing of the module that level cites (PT/EV levels: "מתרחקים"; LB level 18: "נעים זה לצד זה והקרקע שביניהם צנחה"). No assessed item may make a student choose between the two framings.

## §4. Earthquakes, volcanoes, tsunami (EV)

- **Cause:** "לוחות … נתקעים זה בזה בגלל חיכוך. מתח אדיר מצטבר … כשהמתח גדול מדי, הסלעים נשברים פתאום לאורך קו שבר (שנקרא קו שבר או פאלט)". Before the break: "תהליך ארוך של הצטברות מתח, שנמשך לפעמים שנים ועשרות שנים".
- **Focus terms (exact):** "הנקודה שבה משתחררת האנרגיה נקראת **מוקד הרעידה**, והנקודה שמעליה על פני השטח נקראת **מוקד-העל**". The table spells it "מוקד-על". **"אפיצנטר" is not used.**
  - Depth effect: "ככל שהמוקד עמוק יותר, הגלים מחלישים יותר"; table: "ככל שהמוקד רדוד יותר, הרעידה מורגשת בחוזקה רבה יותר".
  - Above the focus: "מוקד-על … שם הנזק הגדול ביותר" (table).
- **Richter (exact):**
  - Table, live only: "סולם לוגריתמי … **כל יחידה = תנודה גדולה פי 10 ואנרגיה גדולה פי 32 בערך**; רעידה בעוצמה 6 משחררת אנרגיה גדולה פי 32 בערך מרעידה בעוצמה 5". The key-points list repeats it.
  - Haiti card: "7.0, שתי יחידות פחות מיפן (**תנודה קטנה פי 100 ואנרגיה קטנה פי 1,000 בערך**)".
  - **The handoff's "2 units = ~100× shaking, ~1,000× energy" is correct and in the module.**
  - Code: `shaking = 10^ΔM`, `energy = 10^(1.5·ΔM)`. That gives 31.6 per unit (≈ "פי 32") and 1,000 per 2 units, so it matches both module statements. Show "בערך" for energy.
- **Mercalli:** "סולם לדרגת הנזק שנגרם לבניינים ולאדם … מותאם לפגיעה בפועל, לא לאנרגיה הפיזיקלית". Note line: "ריכטר מודד אנרגיה אובייקטיבית, מרקלי מודד נזק סובייקטיבי שתלוי גם בסוג הבנייה".
- **Japan vs. Haiti:**
  - Japan 2011, "9.0": "כ-18,000 הרוגים, **בעיקר בגלל הצונאמי**"; waves "יותר מ-40 מטר"; Fukushima.
  - Haiti 2010, "7.0": "כ-200,000 הרוגים. הסיבה: בנייה לא עמידה, עוני, היעדר מוכנות ותכנון".
  - Rule: "הסיכון = חוזק הרעידה × פגיעות האוכלוסייה"; "ההבדל בין 100 הרוגים לבין 10,000 הרוגים באותה עוצמת רעידה יכול לנבוע ממוכנות האוכלוסייה ואיכות הבנייה".
- **Prediction:** "חיזוי מדויק של רעידות אדמה (מתי, היכן, ובאיזו עוצמה) הוא כיום בלתי אפשרי … מדענים יכולים לאמוד **הסתברות** … בטווח של עשרות שנים, אבל לא את התאריך המדויק. לכן הפוקוס הוא על **מוכנות**".
- **Standard 413 (exact):**
  - "תקן בנייה עמידה לרעידות אדמה. התקן מחייב שכל **בניין חדש** בישראל ייבנה כך שיעמוד ברעידת אדמה בעוצמה מסוימת".
  - Old buildings are separate: "בניינים ישנים, שנבנו לפני התקן, הם אלה שמסכנים את האוכלוסייה ביותר. ממשלת ישראל מפעילה תוכניות **לחיזוק** בניינים ישנים".
  - "תקן 413 אינו מסייע בחיזוי רעידות, אלא בהפחתת הנזק".
  - Game wording: new houses are "נבנה לפי תקן 413"; upgrading old houses is "חיזוק מבנה". Don't call a retrofit "413" without that distinction.
- **Preparedness levels:** before ("בנייה עמידה (תקן 413 בישראל), חיזוק מבנים ישנים, **תוכניות פינוי**, מיפוי אזורי סיכון"), during ("שכב, כסה, החזק"), after (rescue, recovery).
- **Tsunami:** "כשסלע נשבר בקרקעית הים, הוא דוחף עמוד מים עצום כלפי מעלה. כך נוצר צונאמי, שהוא **לא גל אחד אלא סדרה של גלים**". Japan had "מערכות התרעה". The "high ground" escape route is OURS; nearest module wording is "תוכניות פינוי".
- **Distribution:** "הן מתרחשות **בעיקר** לאורך גבולות הלוחות".
  - Ring of Fire: "כ-40,000 ק"מ … כ-75% מהרי הגעש הפעילים … וכ-90% מהרעידות החזקות".
  - **Exception given:** "נקודה חמה: מקום קבוע שבו מגמה פורצת מהמעטפת, גם כשאינו על גבול לוחות" (Hawaii).
  - Yearly: "כ-20,000 רעידות … כ-100 רעידות בשנה בעוצמה 6.0 ומעלה".
- **Volcanoes:** פעיל / רדום / כבוי (live table). Hot springs "נפוצים לאורך הבקע … חמת טבריה וחמת גדר". Golan: "עשרות כיפות בזלת", "הר אביטל והר בנטל … הרי געש כבויים".

## §5. Rocks (RM)

- **Three groups** (exact): **סלעי יסוד** "(ממגמה/לבה)", **סלעי משקע** "(משכבות שהושקעו)", **סלעי תמורה** "(מסלע שהשתנה בחום ולחץ)". Live table alternates: "סלעי מרתף / סלעי ראשית", "סלעי שכבה / סלעי אגירה", "סלעי מטמורפוזה". See S7 for why we don't use them.
- **Basalt vs. granite:**
  - "גרניט נוצר ממגמה שהתקררה לאט בתוך האדמה, ולכן יש לו גבישים גדולים. בזלת נוצרת מלבה שהתקררה מהר על פני השטח, ולכן יש לה גבישים קטנים מאוד."
  - Labels: גרניט = "סלע תהום", בזלת = "סלע פרץ".
  - Rule: "מהירות ההתקררות קובעת את גודל הגבישים".
- **Sedimentary:**
  - "גיר (קירטון)": "נוצר ממעטפות ושלדים של יצורים ימיים זעירים (כמו פורמינפרה) … רוב הרי ישראל בנויים מגיר, שנוצר כשישראל הייתה מכוסה בים רדוד".
  - Also אבן חול, חרסית, מלח (הליט); the table adds צור.
  - "**מאובנים רק בסלעי משקע**".
  - Fossil conditions: "קבורה מהירה", "סביבה ימית שקטה", hard parts preserve best.
- **Metamorphic:** "גיר שנחשף לחום ולחץ גבוהים הופך לשיש … כל שיש היה בעבר גיר"; קוורציט from אבן חול; "הסלע לא נמס לחלוטין".
- **Rock cycle:**
  - "1. מגמה עולה ומתמצקת … 2. שחיקה ושקיעה … 3. חום ולחץ … 4. נמיסה … מחזור הסלעים הוא מעגל סגור. אין 'התחלה' ואין 'סוף'".
  - Two drivers: "חום הפנים" and "אנרגיית השמש".
  - Timescales (live table): magma → igneous "אלפים עד מאות אלפי שנים"; → sedimentary "מיליוני שנים"; → metamorphic "עשרות עד מאות מיליוני שנים"; melt "מיליוני שנים".
- **Jerusalem fossils (exact):** "הרי ירושלים, שנמצאים כיום בגובה של **יותר מ-700 מטר** מעל הים … בנויים מגיר, שנוצר לפני כ-100-70 מיליון שנה כשהאזור היה מכוסה **ים רדוד** … **תנועת הלוחות הרימה את האזור** וחשפה את הסלעים".
  - LB agrees: "שדרת ההר נוצרה מהרמה של שכבות שהיו קודם לכן מתחת לים … ובהר מוצאים סלעי גיר ובתוכם מאובנים של יצורים ימיים".
- **Israel:** Golan "בנויה בעיקר בזלת … לפני כ-1-3 מיליון שנה … שדות הבזלת הפוריים". Eilat has granite and diorite "בני מיליארדי שנים".

## §6. Israel's landform belts (LB, LD, WE)

- **Three belts** (exact): "מישור החוף, שדרת ההר ובקע ים המלח והערבה". **"רמת הגולן הבזלתית נלווית אליהן בפינה הצפונית מזרחית ואינה נמנית עם השלוש."** LB also says "מישור החוף, אזור ההר והבקעות המזרחיות".
- **Coastal plain (מישור החוף):**
  - "החול שהגיע בזרמי הים מכיוון **דלתת הנילוס** והסחף שהורידו הנחלים מן ההר הצטברו כאן".
  - "רכסי הכורכר … הם **דיונות חול שהתאבנו** … נמשכים במקביל לקו החוף וחוסמים את ניקוז הנחלים, ולכן נוצרו מזרחית להם ביצות".
  - "חול הכורכר שבחוף הובא ברוח ובגלים"; WE: "כורכר (אבן חול מלוכדת בגיר)".
  - Process: "סחיפה והשקעה". Agents: sea currents and waves, streams, wind.
- **Mountain ridge (שדרת ההר):**
  - "קימוט והרמה"; "מן הגליל דרך השומרון ויהודה ועד הרי הנגב".
  - Rocks: "הגיר והקירטון שבהרי יהודה מעידים על ים קדום"; "מדרונות הגיר של ההר".
  - Watershed: "השדרה משמשת **קו פרשת המים הארצי**, וממנה זורמים הנחלים **מערבה אל הים התיכון ומזרחה אל בקע הירדן**".
  - WE definition: "הקו שלאורך פסגות ההרים, שממנו מתנקזים המים לכיוונים שונים, נקרא קו פרשת מים".
- **Rift (בקע ים המלח והערבה):** "שבירה טקטונית"; depth figures in §3; "סיכון לרעידות אדמה לאורך קו השבר".
- **Golan:** "געשיות"; "זרמה בזלת מהתפרצויות געשיות וכיסתה את השטח בשכבה כמעט שטוחה"; "קרקע כהה ופורייה … חרוטי געש".
- **Belts are separate processes:** "שלוש הרצועות אינן שלבים של תהליך אחד" and "אינן תוצאה של תהליך אחד".
- **Snow wish (LD):** "החרמון … בפסגתו נשמר שלג חודשים אחדים בשנה", fed by "הגובה: … הטמפרטורה נמוכה יותר".

---

## §7. Source simplifications and inconsistencies (do NOT make these assessed facts)

1. **S1, sea-floor age reversed (PT, Wegener evidence 5).** The module says "גיל הסלעים ברצפת הים מראה שהם **צעירים יותר ככל שמתרחקים** מרכס מרכז-האוקיינוס". That is backwards: rock gets older away from the ridge. The game teaches "youngest at the ridge", as the handoff does. Quote only the card title "רצפת האוקיינוס צעירה מהיבשות" and the Atlantic line "בו נוצרת קרקע אוקיינוסית חדשה כל הזמן". Never quote the reversed sentence. Tell the lead/teacher.
2. **S2, the two rift framings** (S3): moving apart, 5–7 mm/yr (PT, ES, EV) vs. "נעים זה לצד זה והקרקע שביניהם צנחה" (LB). EV adds "צפון-מזרחה ביחס". Neither may be assessed against the other.
3. **S3, rift rate vs. plate rate.** The PT rate table gives the Arabian plate **2-3 cm/yr** "מתרחק מהלוח האפריקני", but the same module's rift card says **5-7 mm/yr**. EV says "כמה מ"מ". The likely difference is absolute motion vs. motion across the rift, but the module never explains it. Use **5–7 mm/yr only for the rift**, and never ask students to reconcile the two.
4. **S4, "2–7 cm/yr" isn't a bound.** The same table lists Nazca at 7-8 and Pacific at 5-10 cm/yr, so any 2–10 cm/yr value is module-consistent.
5. **S5, 1927 location.** One card says "בעמק הירדן הצפוני" and also "המוקד היה ליד ים המלח". Only "עמק הירדן / הבקע" is safe.
6. **S6, Golan volcanism dates.** ES and RM say "לפני כ-1-3 מיליון שנה"; EV says the last activity was "לפני כ-2,000 שנה" (Kinneret area ~10,000). Don't assess any date. Use "לפני מיליוני שנים / הגעש כבוי".
7. **S7, rock names and limestone vs. chalk.** RM treats "גיר (קירטון)" as one thing; LB has "הגיר **והקירטון**" as two. RM's table alternates "סלעי מרתף / סלעי ראשית / סלעי אגירה" are non-standard. Assess only יסוד / משקע / תמורה, and never assess גיר = קירטון.
8. **S8, Dead Sea level drop cause.** ES: "עומקו נובע ישירות מהתרחקות הלוחות … קרקעיתו ממשיכה לשקוע". LB: level drops "בכמטר בכל שנה". WE attributes the falling level to people ("הירדן מוטה … מפלס ים המלח יורד"). Don't present the ~1 m/yr fall as tectonic sinking. Our deep-time sinking block is tectonic and runs over Myr.
9. **S9, "floats" and "magma moves plates".** PT: "צפים על המעטפת", "כמו לוחות עץ שצפים על מים זורמים". ES: magma "נמצא בעיקר במעטפת … מזיזה לוחות"; key points "מעטפת (בה המגמה)". These analogies feed the "crust floats on lava" misconception. Model the mantle as **solid, slowly flowing**, with local magma zones, following the layer table ("מעטפת תחתונה … מוצק") and PT ("צמיג מאוד … לא נוזל רגיל").
10. **S10, Mesosaurus.** PT calls it "יצור יבשתי" that couldn't swim. It was actually a freshwater reptile; the logic (it couldn't cross an ocean) still holds. Don't assess "land reptile".
11. **S11, Wegener evidence timing.** Sea-floor age is listed among the "five evidences", but it was mid-20th-century evidence (the module's own story: "במחצית המאה ה-20 נאספו עדויות חדשות"). L10 should present it as later evidence.
12. **S12, extinct-volcano example.** The EV volcano table's example cell reads "הר טאבור? שנוי במחלוקת"; Tabor is not a volcano. Never use it.
13. **S13, minor numeric drift.** Earth's age: 4.5 billion (ES) vs. 4.6 billion (RM). Kola: 12 km vs. 12.2 km; ES also says research wells reach "עשרות קילומטרים", which contradicts Kola being the deepest. Atlantic: joined 200 Myr ago vs. formed 180 Myr ago. RM's section "שלוש שיטות לתארוך" lists 4 methods. Limestone: "כ-100" vs. "100-70" vs. Cretaceous "145-66" Myr. Don't assess these numbers.
14. **S14, "lowest point in the world".** An ES card title says "הנקודה הנמוכה בעולם"; the body says "על יבשה". Always say "ביבשה".
15. **S15, Japan 9.0 "בסולם ריכטר".** Strictly, that is moment magnitude. Keep the module wording, and never ask for scale names beyond Richter vs. Mercalli.
16. **S16, LB terms table.** It pairs "תהליך חיצוני" with "רמת הגולן" in the "הופעה במרחב" column, which contradicts the module's own volcanic Golan. Ignore that pairing.
17. **S17, California.** PT lists California among subduction volcano chains and also gives San Andreas (California) as the transform example. Use San Andreas only for "מחליקים".
18. **S18, wave undercutting called weathering.** WE's coast card calls wave undercutting of kurkar "בליה מכנית וכימית" (that is erosion by waves). It's outside our scope; don't assess it.

## §8. Handoff claims vs. modules

| Handoff says | Module says | Verdict |
|---|---|---|
| 2 units = ~100× shaking, ~1,000× energy | EV comparison card says exactly that; the table gives ×10 / ×32 per unit | **Correct** (module) |
| Plates 2–7 cm/yr | Note "2-7 ס"מ"; table up to 10 | Correct as typical, not a bound (S4) |
| זרמי ערבול | "זרמי ערבול (זרמי קונבקציה)" | Correct |
| Divergent "מתרחקים", convergent "**מתקרבים**", transform "מחליקים זה לצד זה" | "לוחות מתרחקים", "**לוחות מתנגשים**", "לוחות מחליקים" | **Use מתנגשים**, not מתקרבים |
| Continent–continent has no volcanoes | Not stated; only implied by the table | Inference; word it as such |
| Transform shows offset features | Not in modules | OURS visual |
| Rift 5–7 mm/yr apart; LB "side by side, sank" | Both verbatim (§3) | Correct; see S2/S3 in §7 |
| Focus "מוקד, מוקד-על if used" | "מוקד הרעידה" / "מוקד-העל" ("מוקד-על" in table); no "אפיצנטר" | Use these |
| Haiti 7.0 killed far more than Japan 9.0 | ~200,000 vs. ~18,000 (Japan mostly tsunami) | Correct |
| 413 for new buildings, reduces damage, doesn't predict | Verbatim; old buildings get "חיזוק" programs | Correct; don't call retrofits "413" loosely |
| Outer core liquid via seismic waves | "גלי הדף", two wave types, no P/S | Correct; P/S would be OURS |
| Sea floor younger near the ridge | Module sentence is reversed (S1) | Handoff is scientifically right; the module text is wrong |
| Fossils 700+ m | "יותר מ-700 מטר", "ים רדוד", uplift by plate motion | Correct |
| Kurkar "carried by rivers, sea and wind" | Sand from the Nile via sea currents; rivers bring סחף; kurkar sand by wind and waves; kurkar = cemented dunes | Correct in substance |
| Rift "hundreds of metres below sea level" | "השקיעה את הקרקעית מאות מטרים"; Dead Sea ≈ −430 m | Correct |
| L15 "retrofit Jerusalem" | 1927 damage named טבריה, יריחו, שכם | Jerusalem is OURS |
| Golan in the final "belts" | Golan "אינה נמנית עם השלוש" | Don't call Golan a רצועה |
| L11 "boundaries only" | "בעיקר לאורך גבולות" plus the hot-spot exception | Keep hot spots out of L11 or treat them as the exception |

## §9. Misconceptions (handoff) with refuting module evidence

| Code | Misconception | Refuting evidence (module) |
|---|---|---|
| FAST | Plates move fast, or only during quakes | PT "נעים לאט מאוד, כמה סנטימטרים בשנה"; "לאט אבל בלי הפסקה"; EV stress builds "שנים ועשרות שנים" before a quake |
| LAVA | The crust floats on lava | ES table "מעטפת תחתונה … חומר מוצק למרות החום"; magma only in "אזורי המגמה"; PT "צמיג מאוד … לא נוזל רגיל". Caution: PT/ES analogies push the other way (S9) |
| VOLC | All mountains are volcanoes | PT Himalaya "הסלעים מקומטים ומורמים"; LB "שדרת ההר הורמה בקימוט"; ES Alps/Caucasus as uplift |
| COLL | Every collision makes volcanoes | PT table: magma and volcano chains only in "אוקיינוס ביבשה (סובדוקציה)"; continent–continent → "רכסי הרים גבוהים" (implied, not stated) |
| MAG | A higher magnitude always means more deaths | EV Haiti 7.0 ≈200,000 vs. Japan 9.0 ≈18,000; "הסיכון = חוזק הרעידה × פגיעות האוכלוסייה"; "100 … 10,000 הרוגים באותה עוצמת רעידה" |
| PRED | Quakes can be predicted precisely (or 413 predicts them) | EV "חיזוי מדויק … הוא כיום בלתי אפשרי … הסתברות … לא את התאריך המדויק"; "תקן 413 אינו מסייע בחיזוי" |
| SEA | Fossils on mountains mean the sea rose that high | RM "ים רדוד … תנועת הלוחות הרימה את האזור"; LB "הרמה של שכבות שהיו קודם לכן מתחת לים" |
| ROCK | Every rock is the same "stone" | RM "שלוש קבוצות עיקריות לפי אופן היווצרותם"; "כל סלע יכול להפוך לסוג אחר בתנאים מתאימים" |
| CORE | The core is liquid all the way through | ES "הגלעין החיצוני נוזלי … הגלעין הפנימי מוצק בגלל לחץ עצום" |

Extra codes that tests can use (OURS, grounded in modules):
- **LIN**: treating Richter as linear (EV "סולם לוגריתמי").
- **DMG**: treating Richter as damage (EV "מרקלי מודד נזק").
- **INEX**: mixing up internal and external processes, or weathering = erosion (ES; WE "בליה = פירוק במקום. סחיפה = תנועה").
- **BND**: expecting activity away from boundaries (EV "בעיקר לאורך גבולות הלוחות").
- **ONEWAVE**: a tsunami is one wave (EV "לא גל אחד אלא סדרה של גלים").
- **EVID**: a good-looking fit is enough (PT: rejected "כי וגנר לא יכול היה להסביר מה מניע את היבשות").
- **HEAT**: heat makes mountains directly, "hot = high" (PT: heat drives currents that drag plates; uplift comes from collision "הסלעים מקומטים ומורמים", while hot upwelling sits under rifts and ridges, "מגמה עולה … ויוצרת קרקע חדשה").

---

## §10. Notes for the heat-only design (handoff v2)

- **Rates are relative.** "Plates move 5 cm/yr" in L4 must mean the **gap between the shores** grows 5 cm/yr. If each plate moves 5 cm/yr away from a plume, the gap opens at 10 cm/yr and 300 km takes 3 Myr, not 6. The HUD should say "הפער גדל ב-…".
- **Plume / drip wording.** "פלומה חמה / טפטוף קר" are OURS UI words. The module mechanism is PT's "חומר חם … עולה … מתקרר ויורד … הלוחות נגררים יחד עם זרם המעטפת". Plates move away from plumes and toward drips.
- **Temperature readings as evidence (L5).** ES lists real methods: "בארות עמוקות … מדידות טמפרטורה ישירות", "חקר לבה", "מדידות גרביטציה". A named "heat-flow map" instrument is OURS; label it העשרה if presented as science.
- **Direction of rift motion (L15, L18).** EV: "הלוח הערבי זז צפון-מזרחה ביחס ללוח האפריקני". So the Arabian side (east) moves north relative to the African side (west). Encode the shear with that sense.
- **Standard 413 is not from 1927.** General knowledge, not in the modules: Israeli Standard 413 dates from decades later (first edition 1975). The game must not imply 1927 builders used it. L15 splits into a historical act and a "today" act. Don't state the year in-game unless a module gives it.
- **Building classes.** "בנייה לפי תקן 413" is for new buildings; "חיזוק" is for old ones (EV). Before the L15 unlock, use the generic "בנייה עמידה" (EV "בנייה עמידה ומוכנות").
- **Tsunami order.** The module says only "סדרה של גלים". "The first wave isn't necessarily the largest" is OURS and shown only through play.
- **Island arcs.** The modules cover subduction only as ocean under continent. Arc volcanoes form on the overriding plate, inland of the trench. Don't promise "volcanoes offshore" (handoff L11) unless they are labeled העשרה island arcs.
- **Places (L15).** Real coordinates: טבריה 32.79N 35.53E, יריחו 31.86N 35.46E, שכם 32.22N 35.26E, בית שאן 32.50N 35.50E, ירושלים 31.78N 35.22E (Jerusalem is not named in the 1927 card). Show place names only, no border lines (COMMON).

## Appendix A. Table rows missing from the repo snapshots (live JSON, 31 Oct 2026)

- **PT "קצב תנועת לוחות טקטוניים נבחרים"** (לוח | כיוון | קצב):
  - אפריקני | צפון-מזרח | 2-3 ס"מ
  - אינדו-אוסטרלי | צפון | 5-7 ס"מ
  - נאזקה | מזרח | 7-8 ס"מ
  - ערבי | צפון-מזרח | 2-3 ס"מ
  - פסיפי | צפון-מערב | 5-10 ס"מ
- **PT "שלושה סוגי גבולות בין לוחות"**: see §2 (copied in full).
- **ES "שכבות כדור הארץ"**: see §1 (copied in full).
- **EV "מושגים מרכזיים ברעידות אדמה"**: מוקד רעידה, מוקד-על, גלי הדף, קו שבר (פאלט), סולם ריכטר, סולם מרקלי (quoted in §4).
- **EV "סוגי הרי געש לפי מצב הפעילות"**:
  - פעיל: קיליאואה, אטנה
  - רדום: ווסוביוס
  - כבוי: "הר טאבור? שנוי במחלוקת" (see S12)
  - "הר געש שטוח (מגן)": "רמת הגולן - כיפות בזלת"
- **RM "שלוש קבוצות הסלעים"**: יסוד: בזלת (פרץ), גרניט (תהום) | משקע: גיר, אבן חול, חרסית, צור, מלח גס | תמורה: שיש (מגיר), קוורציט (מאבן חול).
- **RM "שלבים במחזור הסלעים"**: timescales in §5.
- **LB "גורמים, ביטויים והשלכות"**:
  - מישור החוף: סחיפה והשקעה
  - שדרת ההר: קימוט והרמה, "קו פרשת המים עובר בפסגות ההר"
  - בקע: שבירה טקטונית
  - גולן: געשיות
- **WE "התהליכים החיצוניים המעצבים"**: בליה = "פירוק הסלע במקומו, בלי הסעה"; סחיפה = "הסעת החומר המפורק בידי מים, רוח או קרח"; השקעה = "הנחת החומר הסחוף במקום חדש".
