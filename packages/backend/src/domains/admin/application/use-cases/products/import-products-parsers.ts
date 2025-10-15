/**
 * Import Products Parsers
 * CSV dosya parsing işlemleri
 */

/**
 * CSV içeriğini satır ve sütunlara parse eder
 * Tırnak işaretleri ve virgül ayırıcılarını doğru şekilde işler
 */
export const parseCsv = (content: string): string[][] => {
  const rows: string[][] = [];
  let current = "";
  let insideQuotes = false;
  const currentRow: string[] = [];

  const pushValue = () => {
    currentRow.push(current);
    current = "";
  };

  const pushRow = () => {
    pushValue();
    rows.push([...currentRow]);
    currentRow.length = 0;
  };

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];

    if (char === "\"") {
      if (insideQuotes && content[i + 1] === "\"") {
        current += "\"";
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      pushValue();
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && content[i + 1] === "\n") {
        i += 1;
      }
      pushRow();
      continue;
    }

    current += char;
  }

  if (insideQuotes) {
    throw new Error("CSV dosyası hatalı: tırnaklar uyumsuz");
  }

  if (current.length > 0 || currentRow.length > 0) {
    pushRow();
  }

  return rows;
};
