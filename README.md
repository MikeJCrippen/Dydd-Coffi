
# ☕ BeanLog Raspberry Pi Setup (Simplified)

Follow these steps to get your espresso logger running as a native-feeling app on your phone.

## 🚀 Step 1: Start the Server
Run the simple Python server. It handles the files but doesn't worry about SSL.
```bash
python3 serve.py
```
*App will be available locally at `http://<pi-ip>:8000`*

---

## 🔒 Step 2: The "Magic" PWA Step
Android requires **HTTPS** to show the "Install App" button. Tailscale can do this for you with one command.

1. **Enable HTTPS** once in your [Tailscale DNS Settings](https://login.tailscale.com/admin/dns).
2. Run this on your Pi:
```bash
tailscale serve --bg 8000
```
*This command tells Tailscale to take your local site and put it on a secure HTTPS address.*

---

## 📱 Step 3: Install on Phone
1. Find your Pi's Tailscale domain (run `tailscale status`).
2. Open that `https://...` address in **Vivaldi** or **Chrome**.
3. Tap the browser menu (three dots) -> **Install App**.

## 🛠 Troubleshooting
- **Can't connect?** Make sure `python3 serve.py` is still running.
- **No "Install" button?** Ensure you are using the `https://` version of the address, not `http://`.
