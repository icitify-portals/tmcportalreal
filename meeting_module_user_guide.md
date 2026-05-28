# Meeting Module User Guide

Welcome to the TMC Portal **Meeting Module** user guide. This module provides a robust suite of tools for scheduling, conducting, and analyzing meetings (Physical, Virtual, and Hybrid) within the portal.

---

## 1. Scheduling a Meeting

As an Administrator, you can schedule meetings for your jurisdiction. 

1. **Accessing the Planner:** Navigate to your Admin Dashboard and select **Meetings**.
2. **Creating the Event:** Click on the **Create Meeting** button.
3. **Important Constraints:** 
   - **No Past Dates:** The system strictly prevents scheduling a meeting with a date/time in the past. Ensure you are setting future dates.
   - **Target Audience:** You can choose who is required to attend (e.g., all members, specific officials, or customized groups).
   - **Format:** Choose between **Physical**, **Virtual**, or **Hybrid**. Virtual/Hybrid meetings will automatically generate secure virtual rooms.
   - **Recurring Meetings:** You can configure a meeting to repeat regularly by selecting a **Frequency** (Weekly, Bi-Weekly, Monthly) and specifying the total number of **Occurrences** (default is 5, maximum 52). All occurrences in the series will securely share the same exact virtual meeting link for convenience!

## 2. The Virtual Meeting Flow

If your meeting format is Virtual or Hybrid, it utilizes the native LiveKit integration to host the meeting directly inside the TMC Portal.

- **Starting the Meeting (Admins Only):** At the scheduled time, the Admin must navigate to the meeting detail page and click the green **Start Meeting** button. This transitions the meeting status from `SCHEDULED` to `ONGOING`.
- **Joining the Room:** Once the status is `ONGOING`, a blue **Join Room** button will appear for all authorized members and admins. Clicking this will open the virtual meeting room.
- **Recording:** Inside the room, Admins will see options to record the meeting directly to the organization's secure cloud storage.
- **Concluding:** When the meeting is finished, the Admin must click **End Meeting** to finalize attendance and close the room. The status will update to `ENDED`.

*Note on Recurring Meetings:* For recurring meetings, the public link and recording link always stay exactly the same. When participants navigate to the recurring meeting link, the system automatically routes them to the currently `ONGOING` instance, or the next upcoming instance in the series.

## 3. Attendance & Punctuality Tracking

The Meeting Module automatically tracks participant attendance for virtual meetings and provides manual/scan tools for physical meetings.

- **Punctuality Analysis:** The system compares a member's `joinedAt` timestamp against the meeting's `scheduledAt` time.
- **Status Badges:** 
  - Members joining before or exactly at the start time are marked **On Time** (Green).
  - Members joining after the start time are marked **Late** (Red) and the dashboard will calculate exactly how many minutes late they were.

## 4. Submitting Meeting Reports & Minutes

### For Attendees (Member Reports)
Attendees can submit their own individual meeting reports/reflections via their Member Dashboard.
- **Submission Window:** Reports can **only** be submitted *after* the meeting has commenced.
- **Deadline:** The default deadline for submitting a report is **2 days after** the meeting's scheduled start time (this timeframe can be adjusted globally by super admins). Reports submitted after the deadline will be flagged as **LATE**.

### For Administrators (Official Minutes)
- **Uploading Minutes:** On the meeting detail page, Admins can upload the official meeting minutes document.
- **Visibility:** Once uploaded, these minutes are permanently attached to the meeting record and accessible to all attendees.

## 5. Reviewing Meeting Analytics

By clicking into any completed meeting, Administrators have access to a full dashboard displaying:
- Total attendees vs expected attendees.
- A breakdown of punctuality.
- Direct links to all submitted member reports and official minutes.
- Cloud recordings (if the meeting was virtual and recorded).

---
*For any technical issues or inquiries regarding the Meeting Module, please contact your support liaison.*
