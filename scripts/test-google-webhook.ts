import "dotenv/config";
import { loadConfig } from "../src/config.js";
import { GoogleCalendarProvider } from "../src/calendar/google.js";

async function main() {
  const config = loadConfig();

  console.log("==================================================");
  console.log(" Google Calendar Webhook Live Verification Script ");
  console.log("==================================================");
  console.log(`Calendar Provider: ${config.calendarProvider}`);
  console.log(`Webhook URL:       ${config.googleWebhookUrl || "(Not set in .env yet)"}`);
  console.log("");

  if (!config.googleWebhookUrl) {
    console.log("❌ GOOGLE_CALENDAR_WEBHOOK_URL is not set in your .env file.");
    console.log("👉 Deploy the script from scripts/google-calendar-webhook.gs and paste the URL in .env.");
    process.exit(1);
  }

  const provider = new GoogleCalendarProvider(config.companyName, config);
  const slots = await provider.availableSlots();

  console.log(`🚀 Sending test booking to Google Calendar...`);
  const slot = slots[0];
  const booking = await provider.book(slot, {
    name: "Alex Vance (Test)",
    phone: "+14155550199",
    email: "alex.vance@example.com",
  });

  console.log("✅ Booking result:", JSON.stringify(booking, null, 2));
  console.log("\n🎉 Check your Google Calendar — you should see the newly scheduled event!");
}

main().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
