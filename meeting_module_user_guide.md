# Meeting Module User Guide

The TMC Portal **Meeting Module** lets you schedule, run, and analyze meetings — physical, virtual, or hybrid — entirely inside the portal. Virtual/hybrid meetings use the built-in LiveKit video room, and all meetings get automatic attendance tracking.

**Guide links:** Admins can also open a compact version inside the app at **Dashboard → Meetings → Guide**.

---

## Roles at a glance

| Role | Page | What they can do |
|---|---|---|
| **Admin** | Dashboard → **Meetings** | Create/edit/delete meetings & groups, start/end/lock, record, run check-in kiosk, upload minutes, view analytics |
| **Member** | Dashboard → **My Meetings** | Accept/decline invites, join the room, self check-in, submit reports, read minutes |
| **Guest** | No login needed | Join a live room via the shared guest link |

---

## 1. Preparing: Meeting Groups (optional)

Meeting Groups are reusable attendee lists that make scheduling faster and enable one-click **Instant Calls**.

1. Go to **Dashboard → Meetings**.
2. Open the **Meeting Groups** tab.
3. Click **Create Group**, give it a name/description, and pick members from the list.
4. Save. The group is now available when scheduling, or as a one-click **Instant Call** (starts a live room for the whole group immediately and redirects you straight into it).

> Groups are scoped to your organization/jurisdiction.

## 2. Scheduling a meeting (Admin)

1. Go to **Dashboard → Meetings** (tab: **Scheduled Meetings**).
2. Click **Create Meeting**.
3. Fill in the form:
   - **Title** and **Description**.
   - **Date & time** — past dates are rejected.
   - **Format** — mark **"Is Online Meeting"** to make it virtual/hybrid. Online meetings automatically get a secure virtual room + a share code.
   - **Venue** — for physical meetings.
   - **Attendees** — invite individual members, or pick a saved **Group**, or set a **Target Audience**.
   - **Recurring** (optional) — set a **Frequency** (weekly/bi-weekly/monthly) and **Occurrences** (default 5, max 52). All instances share one live link; the system routes visitors to the currently ongoing (or next upcoming) instance.
4. Click **Save**. Invited members receive an email invitation with two links (see §4).

## 3. Running the meeting (Admin)

Each meeting is one of three states: **SCHEDULED → ONGOING → ENDED**.

- **Start** — on the meeting detail page, click the green **Start Meeting**. Participants cannot enter the room until this happens.
- **Lock / Unlock** — lock the room to block everyone except admins/the host from joining.
- **Join Room** — click the blue **Join Room** button to enter the video room yourself.
- **Record to S3** — while ONGOING, click the orange **Record to S3** (it pulses while capturing). Click **Recording…** to stop. The file uploads to the org's S3 bucket after processing.
- **End Meeting** — finalizes attendance and closes the room.
- **Copy Live Link** — copies the guest join link to share outside the portal.

> For non-online meetings, the Start button is not shown — run it physically and use the check-in kiosk (§5).

## 4. Joining a meeting

**Members:**
1. Go to **Dashboard → My Meetings**.
2. Open the invite and click **Enter Meeting Room** (or **Accept/Decline** the invite).
3. Once an admin has started the meeting, click **Join Room** to enter the video call. For physical meetings, check in via the kiosk/QR (§5).

**Guests (no account needed):**
1. The invite email / shared link opens `/live/<code>`, or a member shares the **Copy Live Link**.
2. Type your name and click **Join as Guest**. Guests appear in the admin's **Guest Participants** list with their join time.

## 5. Attendance & punctuality (Admin)

1. Open the meeting detail page.
2. Click **Check-in Kiosk** and project it on a screen, or send the attendance link to members.
3. Attendees scan the **QR code** (or open the link) to check themselves in.
4. The **Attendance & Punctuality** table on the detail page shows each member's **Status**, **Joined At**, and punctuality:
   - **On Time** (green) — joined at/before the scheduled start.
   - **Late by X mins** (red) — joined after the start, with exact minutes.
   - Guest joins are listed separately under **Guest Participants**.

## 6. Reports & official minutes

**Member reports:** after the meeting starts, attendees can submit a personal report/reflection from the meeting page. The default deadline is **2 days after** the scheduled start; late submissions are flagged **LATE**.

**Official minutes (Admin):** on the meeting detail page, the **Upload Minutes** card lets admins upload the official minutes document. Once uploaded, it is attached to the meeting for all attendees.

## 7. Meeting Notes & Action Items

Open **Meeting Notes** (from the meeting page) for a OneNote-style workspace:
- Take notes in **sections** — they **auto-save**.
- Click **AI Summary** to have the AI assistant extract decisions + action items into clean HTML (requires the AI integration to be enabled).
- Use the **Action Items** section to assign tasks, set due dates, and track status (pending → completed).
- See **version history** of older versions of your notes.
- **Share** notes with attendees.

## 8. Sharing recordings (Admin)

1. On the meeting detail page, open the **Recording & Playback** card.
2. Click **Generate Secure Playback Link** once the recording has finished uploading.
3. A share code + link are generated. Share the link; viewers enter the code to get a temporary, expiring playback URL streamed securely from S3.

## 9. Analytics (Admin)

On any meeting, click **Analytics** for:
- Total attendees vs. expected.
- Punctuality breakdown.
- Links to all submitted member reports and official minutes.
- Guest participant stats and cloud recordings (if recorded).

---

## Troubleshooting

- **"Can't join the room"** — the meeting must be **ONGOING** (an admin must click **Start Meeting**). Locked rooms only admit admins/host.
- **"Recording not available yet"** — recordings take a few minutes to process/upload after stopping; generate the playback link afterwards.
- **AI summary fails** — the AI provider must be enabled with a valid API key (Dashboard → Settings → AI). DeepSeek requires account balance; Gemini requires a current model.
- **Live links** — the recurring meeting link always routes to the currently ongoing (or next) instance, so the same link works every time.

*For technical support, contact your portal support liaison.*