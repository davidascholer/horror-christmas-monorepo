/**
 * Safe JSON for inline `<script>` data blocks (hydration data, JSON-LD).
 *
 * `<`, `>`, `&`, U+2028 and U+2029 become \uXXXX escapes. The result is still
 * valid JSON that parses back to the same value, but can never contain
 * `</script>`, `<!--` or a raw line separator, so hostile content cannot break
 * out of the script element. One implementation for every data script.
 */
export function serializeJsonForScript(data: unknown): string {
  return JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, (ch) => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'));
}
