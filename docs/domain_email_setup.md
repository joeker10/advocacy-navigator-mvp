# Domain Email & Newsletter Workflow Setup Guide

This guide walks you through setting up your professional domain email `joe@thespecialeducationnavigator.app`, verifying your domain, and connecting it to your application's automated welcome emails and newsletter system.

---

## 📅 Phase 1: Set Up your Domain Email Inbox (Google Workspace)
To receive replies and send emails manually as `joe@thespecialeducationnavigator.app`, you should set up an email inbox. We highly recommend **Google Workspace** (formerly G Suite) for its reliability and spam protection.

1. **Sign Up**: Go to [workspace.google.com](https://workspace.google.com) and sign up using your domain `thespecialeducationnavigator.app`.
2. **Create User**: Create your primary account `joe`.
3. **Verify Domain**: Google will provide a TXT record. Log into your domain registrar (GoDaddy, Namecheap, Google Domains, or Cloudflare) and add this TXT record to your DNS settings.
4. **Configure MX Records**: Google will request that you replace existing MX records with Google's mail servers:
   * **Host**: `@`
   * **Points to**: `SMTP.GOOGLEMAIL.COM` (or the specific addresses Google lists during setup).
   * **Priority**: `1` (or appropriate priority specified by Google).

---

## 🎨 Phase 2: Domain Verification on Resend (For Automated Emails)
Since your application code uses **Resend** (a premium mail service) to trigger welcome emails automatically, you must verify your domain on Resend so they can send emails on your behalf safely without going to spam.

1. **Sign Up on Resend**: Go to [resend.com](https://resend.com) and create an account.
2. **Add Domain**: Go to **Domains** &rarr; **Add Domain** &rarr; Enter `thespecialeducationnavigator.app` &rarr; Select Region `us-east-1` (default).
3. **Add DNS Records on Registrar**: Resend will generate 3 DNS records (DKIM and SPF) that you must add to your registrar:
   * **Record 1 (TXT)**: Name `resend._domainkey` / Value `dkim-key-data...`
   * **Record 2 (TXT)**: Name `@` / Value `v=spf1 include:feedback-smtp.us-east-1.amazonses.com ~all`
   * **Record 3 (MX)**: Name `feedback` / Value `inbound-smtp.us-east-1.amazonaws.com`
4. **Verify**: Click **Verify** in Resend. Once status displays as **Verified**, Resend can officially send emails from `joe@thespecialeducationnavigator.app`.
5. **Get API Key**: Go to **API Keys** &rarr; **Create API Key** &rarr; Name it `Prod_Key` with Full Access. Copy the key.

---

## ⚙️ Phase 3: Connect API Key to your Application Code
Now, tell your Next.js app to use the Resend API key you generated.

1. Open the `.env` file in your project root.
2. Add your Resend key:
   ```env
   RESEND_API_KEY=re_123456789abcdef...
   ```
3. When users sign up or opt-in, the API endpoint `/api/newsletter/subscribe` will detect this key and automatically send the welcome email from `joe@thespecialeducationnavigator.app`.

---

## 🛡️ Phase 4: Protect your Domain (Optional but Recommended)
To prevent bad actors from spoofing your email or sending spam in your name, configure these security standards on your DNS settings:

### 1. DMARC Record (Domain-based Message Authentication)
Add a TXT record to protect your reputation:
* **Type**: `TXT`
* **Host**: `_dmarc` (or `_dmarc.thespecialeducationnavigator.app`)
* **Value**: `v=DMARC1; p=quarantine; pct=100; rua=mailto:joe@thespecialeducationnavigator.app`

### 2. SPF Consolidation
If you use Google Workspace *and* Resend, merge your SPF records into a single TXT record:
* **Type**: `TXT`
* **Host**: `@`
* **Value**: `v=spf1 include:_spf.google.com include:feedback-smtp.us-east-1.amazonses.com ~all`
