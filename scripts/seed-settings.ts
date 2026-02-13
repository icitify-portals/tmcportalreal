import "dotenv/config";
import { db } from "@/lib/db";
import { systemSettings, emailTemplates } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

async function seedSettings() {
  console.log("🔧 Creating system_settings and email_templates tables...");

  // Create system_settings table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS system_settings (
      id VARCHAR(255) PRIMARY KEY,
      settingKey VARCHAR(100) UNIQUE NOT NULL,
      settingValue TEXT,
      category ENUM('EMAIL', 'NOTIFICATION', 'GENERAL') NOT NULL,
      isEncrypted BOOLEAN DEFAULT FALSE,
      description VARCHAR(500),
      updatedBy VARCHAR(255),
      updatedAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      createdAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_category (category),
      INDEX idx_key (settingKey)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Create email_templates table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS email_templates (
      id VARCHAR(255) PRIMARY KEY,
      templateKey VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NOT NULL,
      htmlBody TEXT NOT NULL,
      textBody TEXT,
      variables JSON,
      description VARCHAR(500),
      isActive BOOLEAN DEFAULT TRUE,
      createdAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      INDEX idx_key (templateKey),
      INDEX idx_active (isActive)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log("✅ Tables created successfully");

  // Seed default email settings
  console.log("📧 Seeding default email settings...");

  const emailSettings = [
    {
      id: uuidv4(),
      settingKey: "email.sender_name",
      settingValue: "TMC Connect",
      category: "EMAIL" as const,
      description: "Default sender name for outgoing emails",
    },
    {
      id: uuidv4(),
      settingKey: "email.sender_email",
      settingValue: "info@messages.tmcng.net",
      category: "EMAIL" as const,
      description: "Default sender email address",
    },
    {
      id: uuidv4(),
      settingKey: "email.reply_to",
      settingValue: "",
      category: "EMAIL" as const,
      description: "Reply-to email address (optional)",
    },
  ];

  for (const setting of emailSettings) {
    await db.execute(sql`
      INSERT INTO system_settings (id, settingKey, settingValue, category, description, createdAt, updatedAt)
      VALUES (${setting.id}, ${setting.settingKey}, ${setting.settingValue}, ${setting.category}, ${setting.description}, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      ON DUPLICATE KEY UPDATE settingValue = settingValue
    `);
  }

  // Seed default notification settings
  console.log("🔔 Seeding default notification settings...");

  const notificationSettings = [
    {
      id: uuidv4(),
      settingKey: "notification.provider",
      settingValue: "none",
      category: "NOTIFICATION" as const,
      description: "Push notification provider (none, fcm, onesignal)",
    },
    {
      id: uuidv4(),
      settingKey: "notification.api_key",
      settingValue: "",
      category: "NOTIFICATION" as const,
      description: "API key for push notification provider",
    },
    {
      id: uuidv4(),
      settingKey: "notification.app_id",
      settingValue: "",
      category: "NOTIFICATION" as const,
      description: "App ID for push notification provider",
    },
  ];

  for (const setting of notificationSettings) {
    await db.execute(sql`
      INSERT INTO system_settings (id, settingKey, settingValue, category, description, createdAt, updatedAt)
      VALUES (${setting.id}, ${setting.settingKey}, ${setting.settingValue}, ${setting.category}, ${setting.description}, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      ON DUPLICATE KEY UPDATE settingValue = settingValue
    `);
  }

  // Seed default membership settings
  console.log("👥 Seeding default membership settings...");

  const membershipSettings = [
    {
      id: uuidv4(),
      settingKey: "membership_registration_enabled",
      settingValue: "true",
      category: "GENERAL" as const,
      description: "Allow anyone to apply for membership from the home page",
    },
    {
      id: uuidv4(),
      settingKey: "membership_recommendation_required",
      settingValue: "false",
      category: "GENERAL" as const,
      description: "New applications must be recommended by an official before approval",
    },
  ];

  for (const setting of membershipSettings) {
    await db.execute(sql`
      INSERT INTO system_settings (id, settingKey, settingValue, category, description, createdAt, updatedAt)
      VALUES (${setting.id}, ${setting.settingKey}, ${setting.settingValue}, ${setting.category}, ${setting.description}, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
      ON DUPLICATE KEY UPDATE settingValue = settingValue
    `);
  }

  console.log("✅ Settings seeded successfully");

  // Seed default email templates
  console.log("📝 Seeding default email templates...");

  const templates = [
    {
      id: uuidv4(),
      templateKey: "welcome",
      name: "Welcome Email",
      subject: "Welcome to Muslim Congress",
      htmlBody: `
        <h1>Welcome to Muslim Congress, {{name}}!</h1>
        <p>Your membership has been approved. Your member ID is: <strong>{{memberId}}</strong></p>
        <p>You can now access your member dashboard and enjoy all the benefits of membership.</p>
      `,
      textBody: `Welcome to Muslim Congress, {{name}}!\n\nYour membership has been approved. Your member ID is: {{memberId}}\n\nYou can now access your member dashboard.`,
      variables: JSON.stringify(["name", "memberId"]),
      description: "Welcome email sent to new members",
    },
    {
      id: uuidv4(),
      templateKey: "membership_approved",
      name: "Membership Approved",
      subject: "Membership Approved - Muslim Congress",
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #166534;">Membership Approved!</h1>
          <p>Dear {{name}},</p>
          <p>We are pleased to inform you that your membership application has been <strong>approved</strong>.</p>
          <p>Your official Member ID is: <strong style="font-size: 18px; color: #166534;">{{memberId}}</strong></p>
          <p>You can now access your member dashboard and enjoy all the benefits of membership.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background-color: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Access Dashboard</a>
          </div>
        </div>
      `,
      textBody: `Membership Approved!\n\nDear {{name}},\n\nYour membership application has been approved.\nYour official Member ID is: {{memberId}}\n\nLogin to your dashboard to view details.`,
      variables: JSON.stringify(["name", "memberId", "dashboardUrl"]),
      description: "Membership approval notification",
    },
    {
      id: uuidv4(),
      templateKey: "membership_rejected",
      name: "Membership Rejected",
      subject: "Update on Your Membership Application - Muslim Congress",
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626;">Application Update</h1>
          <p>Dear {{name}},</p>
          <p>Thank you for applying for membership with The Muslim Congress.</p>
          <p>We have reviewed your application and unfortunately, we cannot proceed with it at this time due to the following reason:</p>
          <blockquote style="background-color: #fca5a5; padding: 10px; border-left: 4px solid #dc2626; margin: 20px 0;">
            {{reason}}
          </blockquote>
          <p>Please log in to your dashboard to review the feedback and update your application details.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background-color: #374151; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Dashboard</a>
          </div>
        </div>
      `,
      textBody: `Application Update\n\nDear {{name}},\n\nYour membership application has been reviewed. Unfortunately, we cannot proceed at this time due to the following reason:\n\n{{reason}}\n\nPlease log in to your dashboard to fix the issues and resubmit.`,
      variables: JSON.stringify(["name", "reason", "dashboardUrl"]),
      description: "Membership rejection notification with reason",
    },
    {
      id: uuidv4(),
      templateKey: "payment_received",
      name: "Payment Received",
      subject: "Payment Received - Muslim Congress",
      htmlBody: `
        <h1>Payment Received</h1>
        <p>Dear {{name}},</p>
        <p>We have received your payment of <strong>₦{{amount}}</strong> for {{description}}.</p>
        <p>Thank you for your contribution.</p>
      `,
      textBody: `Payment Received\n\nDear {{name}},\n\nWe have received your payment of ₦{{amount}} for {{description}}.\n\nThank you for your contribution.`,
      variables: JSON.stringify(["name", "amount", "description"]),
      description: "Payment confirmation email",
    },
    {
      id: uuidv4(),
      templateKey: "verification",
      name: "Email Verification",
      subject: "Verify Your Email - TMC Connect",
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #166534;">Email Verification</h1>
          <p>Dear {{name}},</p>
          <p>Thank you for signing up for TMC Connect. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{verificationUrl}}" style="background-color: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">{{verificationUrl}}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
      `,
      textBody: `Email Verification\n\nDear {{name}},\n\nThank you for signing up for TMC Connect. Please verify your email address by visiting this link:\n\n{{verificationUrl}}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.`,
      variables: JSON.stringify(["name", "verificationUrl"]),
      description: "Email verification for new accounts",
    },
  ];

  for (const template of templates) {
    await db.execute(sql`
      INSERT INTO email_templates (id, templateKey, name, subject, htmlBody, textBody, variables, description, isActive, createdAt, updatedAt)
      VALUES (
        ${template.id},
        ${template.templateKey},
        ${template.name},
        ${template.subject},
        ${template.htmlBody},
        ${template.textBody},
        ${template.variables},
        ${template.description},
        TRUE,
        CURRENT_TIMESTAMP(3),
        CURRENT_TIMESTAMP(3)
      )
      ON DUPLICATE KEY UPDATE subject = subject
    `);
  }

  console.log("✅ Email templates seeded successfully");
  console.log("\n🎉 Settings and templates setup complete!");
}

seedSettings()
  .then(() => {
    console.log("✅ Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
