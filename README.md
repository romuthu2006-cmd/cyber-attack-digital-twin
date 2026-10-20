# CyberTwin Live — Cyber Attack Digital Twin

## What this version does
- A website-style dashboard served by a local Python backend.
- Reads network connection metadata visible to the computer running the app (local endpoints, remote endpoints, ports, protocol, state, and PID when available).
- Refreshes the connection list every 10 seconds.
- Provides safe, mock attack-alert scenarios and CSV event export.
- Includes a virtual network asset model for the digital-twin concept.

## Important limitations
This is a student prototype. It does **not** launch attacks, capture packet payloads, inspect all devices on a router, or automatically block traffic. Local connection visibility depends on OS permissions. A web app hosted on a cloud server will see the cloud server's connections, not your laptop's network. Keep live monitoring on your own computer or an authorized lab sensor.

For actual packet-level monitoring, a separate sensor such as Zeek or Suricata should run on an authorized lab machine or mirrored network port; the dashboard can later ingest its logs. Documentation:
- Zeek quick start: https://docs.zeek.org/en/master/quickstart.html
- Suricata: https://docs.suricata.io/
- Render Flask deployment: https://render.com/docs/deploy-flask

## Run on Windows
1. Install Python 3.10+ from https://www.python.org/downloads/ and enable "Add Python to PATH".
2. Extract this ZIP.
3. Double-click `run_windows.bat`, or open a terminal in this folder and run:
   `py -m pip install -r requirements.txt`
   `py server.py`
4. Open `http://127.0.0.1:5000` in your browser.
5. If the connection list is incomplete, close the app and reopen the terminal as Administrator only if you are authorized to do so.

The server binds to localhost by default so it is not exposed to the public internet.

## Getting a public website link
You need to upload this project to a Git repository (e.g. GitHub) and deploy the **dashboard** to a host such as Render. See https://render.com/docs/deploy-flask for steps. For a deployed version, use `LOCAL_ONLY=0` and the host's assigned `PORT`, but remember: the public website will monitor the hosting server, not your laptop. Keep real monitoring local or connect an authenticated, securely configured sensor API. Never expose an unauthenticated live sensor to the internet.

## Project title
Cyber Attack Digital Twin: Live Local Network Connection Monitoring and Threat Visualization

## Architecture
Browser dashboard -> Flask API -> psutil local connection metadata
Safe scenario buttons -> mock alerts -> event feed / CSV export
Future extension -> authorized Zeek/Suricata sensor logs -> backend normalization -> dashboard
