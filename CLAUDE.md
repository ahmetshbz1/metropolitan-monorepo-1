System Directives

Language: Turkish (keep code/API names in English)
Tone: Professional, direct, solution-focused
Style: Concise, technically clear explanations
Error Handling: Hataları açıkça belirt, her zaman uygulanabilir çözüm öner.

Yasaklar

**Emoji Yasağı (STRICT):**
- Kodda emoji YASAK (değişken, fonksiyon, class, interface, type adları)
- Yorum satırlarında emoji YASAK
- Commit message'da emoji YASAK
- Documentation'da emoji YASAK (README, CHANGELOG, API docs)
- Log message'da emoji YASAK (console.log, logger)
- Exception: SADECE user-facing UI text (kullanıcının göreceği metin)

**Mock Veri Yasağı:**
- Kesinlikle mock veri kullanma
- Test'lerde real scenario, integration test tercih et

**Tip Güvenliği:**
- unknown + runtime schema validation (Zod/Valibot) kullan
- Type narrowing zorunlu (typeof, instanceof, type guards)
- any SADECE: 3rd-party tip boşluklarında, izole tip katmanında
- any kullanırsan: // TODO: Remove any - proper type needed şeklinde işaretle
- Her zaman güçlü ve doğru tiplere doğru evrimlendir

**Lokal başlatma YASAK:**
- bun run dev, yarn dev, npm start → CI/CD'de otomatik çalışır
- Agent scope: kod yazma, analiz, deployment hazırlık
- Build/Start: GitHub Actions veya production pipeline'da

Ben izin vermeden commit veya push yapma.

Workflow

**Dev branch** üzerinde çalış (geliştirme ortamı).

Kodunu test et.

Pull Request ile **main branch'e** merge et (production'a otomatik deploy).

Branch Stratejisi:

- `dev` → Geliştirme, test ve deneme
- `main` → Production (CI/CD ile otomatik deployment)

Çalışma Prensipleri:

**Her zaman profesyonel, güvenli ve en garanti yöntemleri kullan:**

- PR merge yerine direkt push yapma
- Manuel işlem yerine otomatik süreçleri tercih et
- Quick fix yerine doğru çözümü uygula
- Test edilmemiş kod deploy etme
- **Migration/Schema değişikliği:**
  - Otomatik snapshot al (DB, config, state)
  - Rollback planı hazırla (geri dönüş adımları)
  - Dry-run ile test et
  - Backup verify et (restore test)

Kodlama Kuralları

Her dosya maksimum 300 satır, ideal olarak 200 satır kod içermeli.

Temiz kod prensiplerine uy:

Fonksiyonlar tek bir işi yapsın.

İsimlendirmeler açık, tutarlı ve anlamlı olsun.

Gereksiz yorum ekleme; yorumlar profesyonel ve Türkçe olmalı.
Ama kod kesinlikle İngilizce olmalı.

Güçlü tip kontrolü kullan (TypeScript, Go, Rust fark etmez).
Kesinlikle Any tipi kullanma %100 tip güvenli olmalı

Kod okunabilir, modüler ve sürdürülebilir olmalı.

Kod Kalitesi ve Standartlar:

**C-level kod standardı (Senior/Principal seviye):**
- Production-ready, maintainable, scalable kod yaz
- Edge case'leri düşün ve handle et
- Performance ve security öncelikli
- Best practice'lere uy (SOLID, DRY, KISS)
- Kendini tekrar etme, modüler ve reusable yaz

**Dosya uzunluk limitine KESINLIKLE uy:**
- Her dosya MAX 300 satır, ideal 200 satır
- Eğer dosya uzuyorsa MUTLAKA modüllere böl
- Helper/utility dosyaları oluştur
- Asla "biraz uzun ama olsun" deme

**Proaktif düşün ve fikir üret:**
- Sadece istenen işi yapma, daha iyi alternatifler sun
- Potansiyel sorunları önceden gör ve çözümle
- Kod review yapar gibi düşün
- Mimari önerilerde bulun

Clean Code Best Practices:

**Error Handling:**
- Try-catch kullan, hataları yakala ve handle et
- Meaningful error messages (kullanıcı ve developer için)
- Logging ekle (production-ready)
- Graceful degradation (hata durumunda yedek çözüm)

**Naming Conventions:**
- Açıklayıcı değişken/fonksiyon isimleri
- Boolean: is/has/should/can ile başla
- Constant: UPPER_SNAKE_CASE
- Class/Type: PascalCase
- Variable/Function: camelCase

**Code Organization:**
- İlgili kodlar bir arada (cohesion)
- Public/private ayrımı net
- Import'lar organize (external → internal → types)
- Barrel export: İç modüllerde kullan, public API'de tree-shaking'e dikkat
- Folder structure mantıklı ve scalable

**Testing:**
- **Coverage hedefleri:**
  - Critical core logic: %90 line/branch coverage
  - Diğer modüller: %70 minimum
- **Test türleri:** Contract + Property + Regression karışımı
- Edge case'leri test et
- Mock data YASAK, real scenario kullan
- Integration test: API contract'ları doğrula

**Documentation:**
- Karmaşık logic için yorum yaz (WHY, not WHAT)
- API endpoint'leri document et
- Type definitions açıklayıcı olsun
- README güncel tut

Araştırma ve Kaynak Kullanımı:

**Bilmediğin konularda ASLA halis görme:**
- Emin değilsen MUTLAKA araştır
- **Sürüm bazlı doğrula:** Latest/stable version kontrol et
- **Official documentation öncelikli** (yıl değil, güncellik önemli)
- Deprecated/outdated docs yerine güncel sürüm docs kullan
- Breaking changes ve migration guide'ları kontrol et

**MCP Araçlarını Efektif Kullan:**
- **exa-code**: Kod örnekleri, library/API kullanımı, SDK docs
- **context7**: Güncel library documentation (resolve-library-id → get-library-docs)
- **WebSearch**: Genel sorular, troubleshooting, sistem tarihini kullan
- **WebFetch**: Spesifik URL'den bilgi çek (official docs)

**Doğru Kaynak Seçimi:**
✅ Official documentation (latest/stable version)
✅ GitHub repo README/docs (current release)
✅ Stack Overflow verified answers (check date + version)
✅ Recent blog/articles (sürüm match kontrolü yap)
❌ Deprecated/outdated documentation
❌ Eski library versiyonları (migration gerekli)
❌ Tahmin ve varsayım
❌ Version mismatch tutorials

**Araştırma Yaklaşımı:**
- Library version kontrol et (package.json, latest release)
- "library-name latest version" veya "library-name vX.X" ara
- Breaking changes ve changelog oku
- Migration guide varsa uygula
- Deprecated API'leri kullanma
