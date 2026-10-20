from flask import Flask, jsonify, send_from_directory
import os
import socket
import psutil

app = Flask(__name__, static_folder="static", static_url_path="/static")

@app.get("/")
def index():
    return send_from_directory(".", "index.html")

def endpoint(addr):
    if not addr:
        return ""
    ip = getattr(addr, "ip", None)
    port = getattr(addr, "port", None)
    if ip is None and isinstance(addr, tuple) and len(addr) >= 2:
        ip, port = addr[0], addr[1]
    return f"{ip}:{port}" if ip is not None and port is not None else str(addr)

@app.get("/api/connections")
def connections():
    rows = []
    try:
        items = psutil.net_connections(kind="inet")
        for c in items:
            proto = "TCP" if c.type == socket.SOCK_STREAM else "UDP"
            rows.append({
                "protocol": proto,
                "local": endpoint(c.laddr),
                "remote": endpoint(c.raddr) if c.raddr else "",
                "state": c.status or ("BOUND" if c.status == "" else "—"),
                "pid": c.pid
            })
        rows.sort(key=lambda x: (x["protocol"], x["local"], x["remote"]))
        listening = sum(1 for c in rows if c["state"] == "LISTEN")
        return jsonify({
            "connections": rows,
            "listening_count": listening,
            "note": "Local OS connection snapshot only. It does not capture all devices on the Wi-Fi/LAN or inspect packet payloads."
        })
    except (psutil.AccessDenied, PermissionError) as e:
        return jsonify({
            "error": "Access denied while reading some network connections. Try launching the local app with appropriate OS permissions.",
            "connections": [],
            "listening_count": 0,
            "note": str(e)
        }), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="127.0.0.1" if os.environ.get("LOCAL_ONLY", "1") == "1" else "0.0.0.0", port=port, debug=False)
