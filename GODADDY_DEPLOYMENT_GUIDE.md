# GoDaddy Deployment Guide

This guide explains how to deploy the **Sangeetha Events Pinner** Next.js application to your GoDaddy domain (`svrpinnerevents.co.uk`).

## Option 1: Standard GoDaddy cPanel (Recommended & Easiest)

This option uses your GoDaddy cPanel shared hosting (Apache). It serves the lightning-fast static HTML files and uses our included PHP fallbacks to handle emails securely.

### Step 1: Build the Project
Run the following command on your local machine to build the static export:
```bash
npm run build
```
Once complete, you will see a new `out/` folder in your project directory. This folder contains your entire compiled website.

### Step 2: Upload to GoDaddy
1. Log in to your GoDaddy account and open **cPanel Admin**.
2. Open the **File Manager**.
3. Navigate to your domain\'s root folder (usually `public_html` or `public_html/svrpinnerevents.co.uk`).
4. Select all the files **INSIDE** the local `out/` folder, zip them (e.g., `build.zip`), and upload the zip file to `public_html`.
5. Extract the zip file in `public_html`. Ensure hidden files like `.htaccess` are extracted successfully (you may need to check "Show Hidden Files" in cPanel settings).

### Step 3: Verify Emails & Security
Because you are using Apache static hosting, the `.htaccess` file we generated will automatically:
- Force HTTPS securely.
- Ensure URLs like `svrpinnerevents.co.uk/terms` work perfectly without `.html`.
- Route contact form submissions to the `api/send-enquiry-email.php` file included in the build.
  
Go to your live website and submit a test booking to ensure you receive the email.

---

## Option 2: GoDaddy cPanel Node.js App (Advanced)

If you have a GoDaddy hosting plan that supports Node.js (via Phusion Passenger):

1. Upload the **entire** project (excluding `node_modules` and `.next`) to a folder outside of `public_html` (e.g., `/home/username/sangeetha-app`).
2. Go to **cPanel > Setup Node.js App**.
3. Create a new application:
   - Node.js version: **20.x** (or highest available).
   - Application mode: **Production**.
   - Application root: `/home/username/sangeetha-app`.
   - Application URL: `svrpinnerevents.co.uk`.
   - Application startup file: `node_modules/next/dist/bin/next`.
4. Click **NPM Install**.
5. Once installed, log in via SSH and run `npm run build` in that directory.
6. Click **Restart** in the Node.js App cPanel page.

---

## Final SEO Checklist
- [x] Canonical URLs are pointing to `https://svrpinnerevents.co.uk`
- [x] `sitemap.xml` and `robots.txt` are included.
- [x] Ensure you have a free AutoSSL or GoDaddy SSL certificate active for `svrpinnerevents.co.uk`.
