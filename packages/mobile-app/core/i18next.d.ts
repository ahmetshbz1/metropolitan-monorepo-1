//  "i18next.d.ts"
//  metropolitan app
//  Created by Ahmet on 02.06.2025.

import "i18next";
import type en from "../locales/en.json";
import type pl from "../locales/pl.json";
import type tr from "../locales/tr.json";

// react-i18next extensions
declare module "i18next" {
  interface CustomTypeOptions {
    resources: {
      tr: typeof tr;
      en: typeof en;
      pl: typeof pl;
    };
  }
}
