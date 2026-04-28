import { jsPDF } from "jspdf";

const doc = new jsPDF();

// Helper for bold text
const bold = () => doc.setFont("helvetica", "bold");
const normal = () => doc.setFont("helvetica", "normal");

// Title
bold();
doc.setFontSize(22);
doc.setTextColor(21, 128, 61); // TMC Green
doc.text("TMC Portal: User Guide", 105, 20, { align: "center" });

// Subtitle
normal();
doc.setFontSize(10);
doc.setTextColor(100, 100, 100);
doc.text("Official Guide for Members, Guests, and Administrators", 105, 28, { align: "center" });

doc.setDrawColor(200, 200, 200);
doc.line(20, 35, 190, 35);

let y = 45;

// Section: Members
bold();
doc.setFontSize(16);
doc.setTextColor(0, 0, 0);
doc.text("1. For Members", 20, y);
y += 10;

normal();
doc.setFontSize(12);
const memberSteps = [
  "Visit tmcng.net/dashboard",
  "Login with your email and password.",
  "Go to Dashboard > Member > Profile to upload your photo.",
  "Navigate to Programmes and click 'Register Now'.",
  "Pay the fee via Paystack (if applicable).",
  "Download your Access Slip from 'My Registrations'."
];

memberSteps.forEach(step => {
  doc.text(`- ${step}`, 25, y);
  y += 8;
});

y += 10;

// Section: Guests
bold();
doc.setFontSize(16);
doc.text("2. For Non-Members / Guests", 20, y);
y += 10;

normal();
const guestSteps = [
  "Visit tmcng.net/programmes.",
  "Select a programme and click 'Register Now'.",
  "Fill the form (Name, Email, Phone).",
  "Select Country, State, and LGA (Nigeria default).",
  "Click 'Register & Pay' and complete the Paystack payment.",
  "You will be redirected to your slip; check your email for the link."
];

guestSteps.forEach(step => {
  doc.text(`- ${step}`, 25, y);
  y += 8;
});

y += 10;

// Section: Admin
bold();
doc.setFontSize(16);
doc.text("3. For Administrators", 20, y);
y += 10;

normal();
const adminSteps = [
  "Log in with Admin credentials.",
  "Go to Admin Dashboard > Programmes to view attendees.",
  "Use the 'Sync/Verify' button for pending payments.",
  "Export data using 'Download CSV' for reports.",
  "Use 'Verify Entry' to scan attendee QR codes at the venue."
];

adminSteps.forEach(step => {
  doc.text(`- ${step}`, 25, y);
  y += 8;
});

// Footer
doc.setFontSize(8);
doc.setTextColor(150, 150, 150);
doc.text(`Generated on ${new Date().toLocaleDateString()} | © The Muslim Congress`, 105, 285, { align: "center" });

// Save
const pdfOutput = doc.output("arraybuffer");
import { writeFileSync } from "fs";
writeFileSync("TMC_User_Guide.pdf", Buffer.from(pdfOutput));

console.log("PDF User Guide generated successfully as TMC_User_Guide.pdf");
