import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import deCommon from "./locales/de/common.json";
import enCommon from "./locales/en/common.json";
import ruCommon from "./locales/ru/common.json";
import arCommon from "./locales/ar/common.json";

export const resources = {
  de: { common: deCommon },
  en: { common: enCommon },
  ru: { common: ruCommon },
  ar: { common: arCommon },
} as const;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "de",
    fallbackLng: "en",
    ns: ["common"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
  });

export default i18n;
