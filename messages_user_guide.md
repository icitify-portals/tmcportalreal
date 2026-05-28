# Messages Module User Guide

Welcome to the TMC Portal **Messages Module**. This module is designed to provide highly secure, end-to-end encrypted (E2EE) communication between members, officials, and administrators within the organization.

---

## 1. Security & End-to-End Encryption

Privacy is paramount. The Messages Module uses military-grade end-to-end encryption. This means that your messages and files are encrypted on your device before they are sent and can only be decrypted by the intended recipients. 

### Setting Up Your Secure Keys
- The first time you open the Messages module, you will be prompted to set up your secure encryption keys.
- You will be asked to create a **Chat PIN**. This PIN is used to unlock your encryption keys on your device. **Do not forget this PIN.**
- Upon successful setup, the system will generate a **Recovery Key**. Save this recovery key somewhere safe (e.g., a password manager). If you ever forget your Chat PIN, you will need this recovery key to reset your PIN and regain access to your chat history.

### Unlocking Your Messages
- Whenever you log into a new session or device, you must enter your **Chat PIN** to unlock your messages. 
- Until unlocked, all message contents remain securely encrypted as cipher-text on the server.

---

## 2. Starting a Conversation

You can start conversations with any registered member in the portal.

### Finding Users
1. Click the **`+` (New Chat)** button at the top of the chat list.
2. In the search box, start typing the name of the user you wish to contact (minimum 2 characters).
3. Check the box next to their name in the results.

### Direct Messages (1-on-1)
- Select exactly **one user** from the search results.
- Click **Start Chat**. 

### Group Chats
- Select **multiple users** from the search results.
- A new field will appear prompting you to enter a **Group Name**.
- Enter a descriptive name for your group and click **Create Group**.

---

## 3. Sending Messages & Attachments

Once you are in a chat, communicating is simple and secure.

- **Text Messages:** Type your message in the input bar at the bottom and click the Send icon.
- **Attachments:** Click the **Paperclip icon** to attach a file. You can attach images, videos, audio files, or documents. 
- *Note on File Security:* Before the file leaves your device, it is encrypted using the unique session key of your chat. Only the members of the chat can decrypt and view the media.

---

## 4. Troubleshooting & FAQs

**Q: I forgot my Chat PIN. What do I do?**
A: On the unlock screen, click the "Reset with Recovery Key" link at the bottom. You will be prompted to enter the Recovery Key you saved during your initial setup. Once verified, you can set a new PIN.

**Q: Can administrators read my direct messages?**
A: **No.** Because the system uses true End-to-End Encryption (E2EE), the server only stores encrypted text. Neither administrators nor database operators can read your messages unless they are a participant in the chat.

**Q: Why does a message say "⚠️ Decryption Failed"?**
A: This usually occurs if the sender's device failed to properly encrypt the message for your public key, or if your private key was reset improperly.

*For any technical issues regarding the Messages Module, please contact your support liaison.*
