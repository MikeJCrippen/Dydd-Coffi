
# ☕ BeanLog Setup Guide

The app is built to be a **Standalone PWA**. Since it uses your browser's local storage, your data stays on your phone regardless of where the files are hosted.

---

## 💎 Option A: The "Cleanest" Way (Recommended)
Host the files on a free service. This gives you a permanent `https://` address and the **"Install App"** button on your phone.

1. Go to [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop this entire folder into the browser.
3. Once it's live, open that URL on your phone in Vivaldi/Chrome.
4. Tap **"Install App"** or **"Add to Home Screen"**.
5. **Done.** No server to maintain, works 100% offline.

---

## 🏠 Option B: The "Local Pi" Way
Use this if you want to keep everything on your local network.

1. On your Pi, run:
   ```bash
   python3 serve.py
   ```
2. On your phone, go to `http://<your-pi-ip>:8000`.
3. **Note:** Because it is `http` (not `https`), you won't see an "Install App" button. 
4. Instead, open the Vivaldi menu and tap **"Add to Home Screen"**.
5. It will still create an icon on your phone and open in a standalone window!

---

## 💾 Data Safety
Because your data is stored in your phone's browser, use the **Data Vault** (Database icon) inside the app to export `.json` backups occasionally. You can then import these backups into any other browser or device.
