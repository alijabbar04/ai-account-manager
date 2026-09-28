# Phone companion

**AI Account Usage** is a read-only Android app that shows the dashboard's three
accounts (work Claude, personal Claude, GPT / Codex) with their plans, usage
bars and reset times. It has no buttons that act on an account. It only shows
usage.

## How it gets its numbers

The phone never signs in to Claude or ChatGPT. Claude refresh tokens rotate on
use, so a phone refreshing one would sign the PC out. Instead:

1. The desktop app keeps polling usage as it always has (every 10 minutes, on
   window focus, and on **↻ Refresh**).
2. With phone sharing on, it also serves a small read-only snapshot over HTTP on
   **this PC's Tailscale address only** (port 47821 by default).
3. The phone reads that snapshot over your tailnet, every minute while the app
   is open, and when you tap **↻**, which also asks the PC to poll now (at most
   once a minute).
4. After every successful sync the phone saves the snapshot to the app's
   private storage, so it survives closing the app, a phone restart and app
   updates. Opened with the PC off or unreachable, the app shows those figures
   straight away, marked *Last known* ("Last synced 3h ago · connecting…", then
   *PC offline* once the connection attempt fails). Reset times are absolute,
   so countdowns stay right offline, and a window whose reset has passed shows
   *reset since last update* rather than a stale percentage.
5. While the app is open it keeps trying once a minute, so the figures update
   within a minute of the PC coming back. It does not sync in the background
   while closed. It catches up the next time you open it.

So the phone can only be as fresh as the PC. It updates while AI Account Manager
is running, which is why phone sharing keeps the app in the tray when you close
the window (Settings › Phone companion › *Keep running in the tray when
closed*).

## Setting it up

You need [Tailscale](https://tailscale.com) signed in to the same tailnet on the
PC and the phone.

1. On the PC: **Settings › Phone companion › Share usage with my phone**.
   Windows Firewall may ask whether AI Account Manager can accept connections.
   Allow it, or the phone cannot connect.
2. Choose **Pair a phone**. A QR code, the PC's Tailscale address, the port and a
   one-time code appear. The code lasts 10 minutes and dies after 5 wrong tries.
3. Install the APK on the phone (see below), then either scan the QR code with
   the camera app (it opens AI Account Usage and pairs it) or open the app and
   type the address, code and port.

**Unpair** on the PC revokes the phone at once. Pairing a different phone
replaces the old one. Only one phone is paired at a time.

## What the phone can see

| Leaves the PC | Never leaves the PC |
| --- | --- |
| Account names, roles, emails, plan names | OAuth access and refresh tokens |
| Usage percentages, reset times, extra-usage totals | API keys, config folders, file paths |
| The PC's host name | Anything from Other Accounts or hidden profiles |

The server listens on the Tailscale interface only (never `0.0.0.0`), refuses any
peer outside `100.64.0.0/10`, and requires the device token issued at pairing
for everything except pairing itself. The token is stored DPAPI-encrypted on the
PC and compared in constant time. Traffic is plain HTTP inside Tailscale's
WireGuard tunnel. On the phone, the native network bridge refuses any host that
is not a Tailscale address or a `*.ts.net` name.

## Building the APK

The app is a WebView around `mobile/android/assets` (plain HTML/CSS/JS) plus one
Java activity. It builds with the Android SDK's command-line tools directly, with
no Gradle:

```powershell
node mobile/android/build.cjs
```

It needs JDK 17+ and an Android SDK with `build-tools;35.0.1` and
`platforms;android-35`. By default it looks in `D:\DevTools\jdk-17` and
`D:\DevTools\android-sdk`; set `JAVA_HOME` and `ANDROID_HOME` to use others.
Output: `mobile/android/build/AI-Account-Usage-<version>.apk` (git-ignored).

**Keep the signing key.** The first build creates `~\.aam-android-signing\`
(`aam-usage.p12` plus its password file) outside the repository. Android only
installs an update signed with the same key. If the key is lost, uninstall the
app before installing a newly signed build.

To check the UI without a phone:

```powershell
npx electron tests/phone-ui-smoke.cjs --output=release/phone-smoke
```

It pairs the bundled page with a real `PhoneSyncServer` on `127.0.0.1` and
screenshots the pair, dashboard (dark and light), PC-offline and unpaired
states. It uses the page's `fetch` fallback, so the Java bridge is the one
part it does not exercise.

## Troubleshooting

- **"Can't reach 100.x.x.x"**: check that Tailscale is connected on both
  devices, that phone sharing is on and Settings shows *Reachable at …*, and that
  Windows Firewall allowed AI Account Manager.
- **Settings says "Waiting for Tailscale"**: the PC has no Tailscale address
  yet. It retries every 30 seconds.
- **Installing is blocked on a Samsung phone**: turn off *Settings › Security and
  privacy › Auto Blocker* while you install, and allow the app you opened the APK
  from to install unknown apps.
- **"This phone is no longer paired"**: the PC unpaired it or another phone was
  paired. Pair again from Settings.
