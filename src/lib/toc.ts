export interface Heading {
  id: string;
  text: string;
  level: number;
}

export function extractHeadings(body: string): Heading[] {
  const headings: Heading[] = [];
  const lines = body.split("\n");

  for (const line of lines) {
    if (line.startsWith("## ")) {
      const text = line.slice(3).trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 50);
      headings.push({ id, text, level: 2 });
    } else if (line.startsWith("### ")) {
      const text = line.slice(4).trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 50);
      headings.push({ id, text, level: 3 });
    }
  }

  return headings;
}