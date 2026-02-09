# ☕ BeanLog Raspberry Pi Setup

This guide ensures your premium espresso logger runs perfectly on your Raspberry Pi without needing a complex build system.

## 🛠 Prerequisites
- A Raspberry Pi (any model) running Raspberry Pi OS.
- Your Android phone (Chrome or Vivaldi) connected to the same Wi-Fi.

---

## 📂 1. Setup the Folder
Create a folder on your Pi and place all project files inside it:
- `index.html`
- `index.tsx`
- `App.tsx`
- `types.ts`
- `manifest.json`

---

## 🚀 2. Hosting (Fixing the Blank Screen)
Standard Python servers don't know what a `.tsx` file is, so they serve them incorrectly. Use this custom script instead.

1. Create a file named `serve.py` in your project folder:
```python
import http.server
import socketserver

PORT = 8080
Handler = http.server.SimpleHTTPRequestHandler

# This tells the browser that .tsx and .ts files are actually javascript
Handler.extensions_map.update({
    '.tsx': 'application/javascript',
    '.ts': 'application/javascript',
})

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"☕ BeanLog active at http://localhost:{PORT}")
    httpd.serve_forever()
```

2. Run it on your Pi:
```bash
python3 serve.py
```

3. Open Vivaldi on your Android and go to: `http://<YOUR_PI_IP>:8080`

---

## 🔒 3. Making it "Installable" (HTTPS)
Vivaldi requires HTTPS for the **"Install app"** button to appear. 

1. Install Tailscale on your Pi: `curl -fsSL https://tailscale.com/install.sh | sh`
2. Run `sudo tailscale up`.
3. Enable **MagicDNS** and **HTTPS** in your Tailscale admin console.
4. Access your app via your private URL: `https://raspberrypi.your-tailscale-id.ts.net:8080`

---

## ⚠️ 4. Troubleshooting
- **Blank Screen?** Check the browser console (if possible) or ensure `serve.py` is running. 
- **Still Blank?** Ensure you are connected to the internet. The app needs to download React and the Transpiler from `esm.sh` once when it first loads.
- **VNC Offline?** Run `sudo raspi-config`, go to **Advanced Options > Wayland**, and set it to **X11**.

---

## 🔄 5. Data Safety
Your data is stored in the **phone's browser**. Use the **Data Vault** icon (Database) inside the app to export a `.json` backup regularly.
