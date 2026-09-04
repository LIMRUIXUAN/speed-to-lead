/**
 * ==============================================================================
 * Google Apps Script — Speed-to-Lead Automatic Calendar Sync Webhook
 * ==============================================================================
 * 
 * Instructions to Deploy (Takes < 2 minutes, 100% Free, Zero Cloud Setup):
 * 
 * 1. Go to https://script.google.com/ and click "New project".
 * 2. Delete any existing code, paste ALL the code below, and click "Save" (Ctrl+S).
 * 3. Click "Deploy" (top-right blue button) ➔ "New deployment".
 * 4. Under "Select type", click the gear icon ⚙️ ➔ choose "Web app".
 * 5. Configure:
 *    - Description: "Speed to Lead Calendar Webhook"
 *    - Execute as: "Me" (your email)
 *    - Who has access: "Anyone"  <-- IMPORTANT!
 * 6. Click "Deploy" ➔ "Authorize access" (sign in with your Google account and allow).
 * 7. Copy the "Web app URL" (starts with https://script.google.com/macros/s/.../exec).
 * 8. Paste it into your .env file:
 *    CALENDAR_PROVIDER=google
 *    GOOGLE_CALENDAR_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_URL/exec
 * ==============================================================================
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: "Empty request payload" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    var title = data.title || "Speed-to-Lead Demo";
    var startTime = new Date(data.start);
    var endTime = new Date(data.end);
    var description = data.description || "Autonomous Speed-to-Lead AI Qualified Demo";
    var location = data.attendeePhone ? ("Phone: " + data.attendeePhone) : "Phone / Video Call";
    var attendeeEmail = data.attendeeEmail ? data.attendeeEmail.trim() : null;

    var calendar = CalendarApp.getDefaultCalendar();
    
    // Create the event on your primary Google Calendar
    var eventOptions = {
      description: description,
      location: location,
      guests: attendeeEmail ? attendeeEmail : undefined,
      sendInvites: attendeeEmail ? true : false
    };

    var event = calendar.createEvent(title, startTime, endTime, eventOptions);
    var eventId = event.getId();

    // Generate direct calendar edit/view URL
    var cleanId = eventId.split("@")[0];
    var eventUrl = "https://calendar.google.com/calendar/u/0/r/eventedit/" + Utilities.base64Encode(cleanId + " " + calendar.getId());

    return ContentService
      .createTextOutput(JSON.stringify({
        ok: true,
        id: eventId,
        url: eventUrl,
        title: title,
        start: startTime.toISOString(),
        end: endTime.toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: false,
        error: err.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Simple test function you can run inside the Apps Script editor to verify permissions
function testCreateSampleEvent() {
  var now = new Date();
  var start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  var end = new Date(start.getTime() + 30 * 60 * 1000);
  
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        title: "⚡ Test Speed-to-Lead Demo",
        start: start.toISOString(),
        end: end.toISOString(),
        attendeeName: "Jordan Smith",
        attendeePhone: "+14155550100",
        attendeeEmail: "",
        description: "Test qualification event from Google Apps Script."
      })
    }
  };
  
  var response = doPost(mockEvent);
  Logger.log(response.getContent());
}
