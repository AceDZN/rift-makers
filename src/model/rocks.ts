// Rocks the planet makes (rocks-minerals module). The player never clicks a
// process: heat and time make the conditions, the hammer reads the result.

export type RockSample = 'basalt' | 'granite' | 'limestone' | 'marble' | 'folded' | 'soil';

export const ROCK_HE: Record<RockSample, string> = {
  basalt: 'בזלת',
  granite: 'גרניט',
  limestone: 'גיר עם מאובנים',
  marble: 'שיש',
  folded: 'סלע מקומט',
  soil: 'אדמה',
};

export const ROCK_FAMILY_HE: Record<RockSample, string> = {
  basalt: 'סלע יסוד: לבה שהתקררה מהר על פני השטח, גבישים זעירים',
  granite: 'סלע יסוד: מגמה שהתקררה לאט בעומק, גבישים גדולים',
  limestone: 'סלע משקע: צדפים ושלדים ששקעו בים רדוד והתהדקו',
  marble: 'סלע תמורה: גיר שנמעך בחום ובלחץ והשתנה בלי להיתך',
  folded: 'שכבות שקומטו בהתנגשות, עוד לא שיש',
  soil: 'אדמה ושברי סלע',
};
