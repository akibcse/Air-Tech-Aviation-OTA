/**
 * Secure Date Utility for OTA application.
 * Prevents 1-day offset bugs by ensuring all date-to-string 
 * and string-to-date conversions are performed in LOCAL timezone.
 */
export class DateUtils {
  /**
   * Formats a local Date object to 'YYYY-MM-DD' without UTC conversion.
   */
  static formatLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Parses a 'YYYY-MM-DD' string into a local Date object.
   */
  static parseLocal(dateStr: string): Date {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date();
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  /**
   * Adds days to a date string while maintaining local timezone.
   */
  static addDays(dateStr: string, days: number): string {
    const date = this.parseLocal(dateStr);
    date.setDate(date.getDate() + days);
    return this.formatLocal(date);
  }
}
