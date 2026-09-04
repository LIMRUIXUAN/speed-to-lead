/**
 * TCPA (Telephone Consumer Protection Act) & International Calling Hours Guard.
 * Restricts autonomous outbound phone calls to permissible business hours
 * (8:00 AM - 8:30 PM local time) to prevent carrier spam flags and legal violations.
 */

export interface TcpaComplianceResult {
  allowed: boolean;
  phone: string;
  timezone: string;
  localTime: string;
  localHour: number;
  reason: string;
  suggestedAction: "call_immediately" | "queue_for_morning";
  nextPermissibleTime: string;
}

const PREFIX_TIMEZONE_MAP: Record<string, string> = {
  "+60": "Asia/Kuala_Lumpur",
  "+65": "Asia/Singapore",
  "+44": "Europe/London",
  "+49": "Europe/Berlin",
  "+33": "Europe/Paris",
  "+34": "Europe/Madrid",
  "+52": "America/Mexico_City",
  "+81": "Asia/Tokyo",
  "+61": "Australia/Sydney",
  "+91": "Asia/Kolkata",
  "+852": "Asia/Hong_Kong",
  "+971": "Asia/Dubai",
  "+62": "Asia/Jakarta",
  "+63": "Asia/Manila",
};

/**
 * Common US / Canada area codes mapped to representative regional timezones.
 */
const US_AREA_CODE_TIMEZONES: Record<string, string> = {
  // Pacific (PT)
  "206": "America/Los_Angeles", "209": "America/Los_Angeles", "213": "America/Los_Angeles",
  "310": "America/Los_Angeles", "408": "America/Los_Angeles", "415": "America/Los_Angeles",
  "503": "America/Los_Angeles", "510": "America/Los_Angeles", "619": "America/Los_Angeles",
  "650": "America/Los_Angeles", "702": "America/Los_Angeles", "714": "America/Los_Angeles",
  "818": "America/Los_Angeles", "858": "America/Los_Angeles", "916": "America/Los_Angeles",
  "925": "America/Los_Angeles", "949": "America/Los_Angeles",

  // Mountain (MT)
  "303": "America/Denver", "480": "America/Phoenix", "505": "America/Denver",
  "602": "America/Phoenix", "623": "America/Phoenix", "719": "America/Denver",
  "720": "America/Denver", "801": "America/Denver",

  // Central (CT)
  "214": "America/Chicago", "312": "America/Chicago", "469": "America/Chicago",
  "512": "America/Chicago", "612": "America/Chicago", "713": "America/Chicago",
  "773": "America/Chicago", "817": "America/Chicago", "832": "America/Chicago",
  "972": "America/Chicago",

  // Eastern (ET)
  "212": "America/New_York", "305": "America/New_York", "347": "America/New_York",
  "404": "America/New_York", "407": "America/New_York", "412": "America/New_York",
  "617": "America/New_York", "646": "America/New_York", "704": "America/New_York",
  "718": "America/New_York", "786": "America/New_York", "917": "America/New_York",
};

/**
 * Infer the prospect's local timezone from E.164 phone prefix.
 */
export function resolvePhoneTimezone(phone: string): string {
  if (phone.startsWith("+1") && phone.length >= 5) {
    const areaCode = phone.slice(2, 5);
    if (US_AREA_CODE_TIMEZONES[areaCode]) {
      return US_AREA_CODE_TIMEZONES[areaCode];
    }
    return "America/New_York"; // Default US fallback
  }

  for (const [prefix, tz] of Object.entries(PREFIX_TIMEZONE_MAP)) {
    if (phone.startsWith(prefix)) {
      return tz;
    }
  }

  return "UTC";
}

/**
 * Evaluate if the phone number can be dialed right now under TCPA quiet hours (8am - 8:30pm).
 */
export function checkTcpaCompliance(
  phone: string,
  now: Date = new Date(),
  overrideAllowAll = false,
): TcpaComplianceResult {
  const timezone = resolvePhoneTimezone(phone);

  // Format local hour and full time string in target timezone
  const hourFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
  });
  const localHour = parseInt(hourFormatter.format(now), 10);

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const localTime = timeFormatter.format(now);

  // TCPA permissible window: 08:00 to 20:30 (8:30 PM)
  const isWithinHours = overrideAllowAll || (localHour >= 8 && localHour < 21);

  const nextPermissibleTime = isWithinHours
    ? "Now"
    : `Tomorrow at 9:00 AM (${timezone.split("/")[1]?.replace(/_/g, " ") || timezone})`;

  if (isWithinHours) {
    return {
      allowed: true,
      phone,
      timezone,
      localTime,
      localHour,
      reason: `Local time is ${localTime} in ${timezone}, which is within permissible calling hours (8:00 AM - 8:30 PM).`,
      suggestedAction: "call_immediately",
      nextPermissibleTime,
    };
  }

  return {
    allowed: false,
    phone,
    timezone,
    localTime,
    localHour,
    reason: `Local time is ${localTime} in ${timezone}. Outside TCPA permissible calling hours (8:00 AM - 8:30 PM). Outbound call withheld to prevent carrier spam penalties.`,
    suggestedAction: "queue_for_morning",
    nextPermissibleTime,
  };
}
