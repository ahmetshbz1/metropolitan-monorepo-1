//  "content.routes.ts"
//  metropolitan backend
//  Created by Ahmet on 27.06.2025.

import { createApp } from "../../../../shared/infrastructure/web/app";
import { faqContent } from "../../domain/value-objects/faq.content";
import { termsContent } from "../../domain/value-objects/terms.content";

export const contentRoutes = createApp().group("/content", (app) =>
  app
    // Sıkça Sorulan Sorular (SSS)
    .get("/faq", () => {
      return {
        success: true,
        data: {
          title: faqContent.title,
          lastUpdated: faqContent.lastUpdated,
          sections: faqContent.sections,
        },
      };
    })

    // Kullanım Koşulları ve Gizlilik Politikası
    .get("/terms", () => {
      return {
        success: true,
        data: {
          title: termsContent.title,
          lastUpdated: termsContent.lastUpdated,
          content: termsContent.content,
        },
      };
    })
);
