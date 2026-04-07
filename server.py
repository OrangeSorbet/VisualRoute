from flask import Flask, request
import subprocess

app = Flask(__name__)

@app.route("/run-graph")
def run_graph():
    lat = request.args.get("lat")
    lon = request.args.get("lon")

    subprocess.run(["python", "src/scripts/extract_graph.py", lat, lon])
    return {"ok": True}

app.run(port=5000)