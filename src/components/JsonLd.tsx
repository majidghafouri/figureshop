interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * Serialize data into a JSON-LD payload that is safe to embed inside a
 * <script> tag. Without escaping, a value containing "</script>" could break
 * out of the <script> element and execute as HTML/JS (CWE-79). Escaping <, >,
 * & and the line/paragraph separators neutralizes that vector.
 */
function escapeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJsonLd(data) }}
    />
  );
}
