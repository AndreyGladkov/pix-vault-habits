export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  // Normalize CRLF / CR to LF so the parser only deals with one line ending.
  const normalized = text.replace(/\r\n?/g, "\n");

  while (i < normalized.length) {
    const char = normalized[i];

    if (inQuotes) {
      if (char === '"') {
        // Escaped quote?
        if (normalized[i + 1] === '"') {
          currentField += '"';
          i += 2;
          continue;
        }
        // Closing quote.
        inQuotes = false;
        i++;
        continue;
      }
      currentField += char;
      i++;
      continue;
    }

    // Not inside quotes.
    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (char === ",") {
      currentRow.push(currentField);
      currentField = "";
      i++;
      continue;
    }

    if (char === "\n") {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      i++;
      continue;
    }

    currentField += char;
    i++;
  }

  // Flush the last field/row if there is any pending content.
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

export const toCsv = (rows: string[][]): string => {
  const lines: string[] = [];

  for (const row of rows) {
    const fields = row.map((field) => {
      if (/[",\n]/.test(field)) {
        return '"' + field.replace(/"/g, '""') + '"';
      }
      return field;
    });
    lines.push(fields.join(","));
  }

  return lines.join("\n");
}

export const generateId = (name: string): string => {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9Ѐ-ӿ]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).substring(2, 6);
  return `habit_${slug}-${suffix}`;
}

export const formatDate = (date?: Date): string => {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const dateFromString = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}
