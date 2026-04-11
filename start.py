#!/usr/bin/env python3
"""
Kisaan AI - Local Development Launcher
Starts both backend (FastAPI) and frontend (Vite) with a single command.

Usage:
    python start.py           # Start both servers
    python start.py --backend # Start backend only
    python start.py --frontend # Start frontend only
"""

import subprocess
import sys
import os
import signal
import time

processes = []

def cleanup(signum=None, frame=None):
    print("\n🛑 Shutting down Kisaan AI...")
    for p in processes:
        try:
            p.terminate()
            p.wait(timeout=5)
        except Exception:
            p.kill()
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

def start_backend():
    print("🚀 Starting Backend → http://localhost:8000")
    print("📄 API Docs → http://localhost:8000/docs")
    return subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd=os.path.dirname(os.path.abspath(__file__))
    )

def start_frontend():
    print("🌐 Starting Frontend → http://localhost:5173")
    return subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=os.path.dirname(os.path.abspath(__file__)),
        shell=True
    )

if __name__ == "__main__":
    args = sys.argv[1:]

    # Check .env exists
    if not os.path.exists(".env"):
        print("⚠️  No .env file found! Copy .env.example to .env and add your keys:")
        print("    cp .env.example .env")
        sys.exit(1)

    print("=" * 50)
    print("🌾 Kisaan AI - Local Development Server")
    print("=" * 50)

    if "--backend" in args:
        processes.append(start_backend())
    elif "--frontend" in args:
        processes.append(start_frontend())
    else:
        processes.append(start_backend())
        time.sleep(2)  # Let backend start first
        processes.append(start_frontend())

    print("\n✅ All servers running. Press Ctrl+C to stop.\n")

    # Wait for processes
    try:
        for p in processes:
            p.wait()
    except KeyboardInterrupt:
        cleanup()
