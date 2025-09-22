import {TAGESZEIT} from "../models/constants";

export function getTageszeit(): TAGESZEIT {
    const stunde = new Date().getHours();

    if (stunde >= 5 && stunde < 9) return TAGESZEIT.MORGENS;
    if (stunde >= 9 && stunde < 12) return TAGESZEIT.VORMITTAGS;
    if (stunde >= 12 && stunde < 14) return TAGESZEIT.MITTAGS;
    if (stunde >= 14 && stunde < 18) return TAGESZEIT.NACHMITTAGS
    if (stunde >= 18 && stunde < 22) return TAGESZEIT.ABENDS;
    return TAGESZEIT.NACHTS;
}