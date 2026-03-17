#!/bin/bash

# Travelclaw Discord Listener Startup Script
# Usage: ./start-listener.sh [start|stop|status|logs]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/channel-listener.pid"
LOG_FILE="$SCRIPT_DIR/channel-listener.log"
COMMAND="${1:-start}"

start() {
  # Check if already running
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
      echo "ℹ️  Listener process already running (PID: $PID)"
      echo "📄 Log file: $LOG_FILE"
      exit 0
    else
      echo "⚠️  Found stale PID file, cleaning up..."
      rm -f "$PID_FILE"
    fi
  fi

  # Check dependencies
  if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "⚠️  node_modules not found, installing dependencies..."
    cd "$SCRIPT_DIR"
    npm install
  fi

  # Start process
  cd "$SCRIPT_DIR"
  nohup node channel-listener.js > "$LOG_FILE" 2>&1 &
  echo $! > "$PID_FILE"

  sleep 1

  if ps -p $(cat "$PID_FILE") > /dev/null 2>&1; then
    echo "✅ Listener process started (PID: $(cat $PID_FILE))"
    echo "📄 Log file: $LOG_FILE"
    echo ""
    echo "💡 Tips:"
    echo "   - View logs: tail -f $LOG_FILE"
    echo "   - Stop service: $0 stop"
    echo "   - Check status: $0 status"
  else
    echo "❌ Startup failed, check logs: $LOG_FILE"
    exit 1
  fi
}

stop() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
      echo "⏹️  Stopping listener process (PID: $PID)..."
      kill $PID
      sleep 2
      if ps -p $PID > /dev/null 2>&1; then
        echo "⚠️  Process not responding, force killing..."
        kill -9 $PID
      fi
      rm -f "$PID_FILE"
      echo "✅ Stopped"
    else
      echo "ℹ️  Process not running, cleaning up PID file"
      rm -f "$PID_FILE"
    fi
  else
    echo "ℹ️  Listener process not running"
  fi
}

status() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p $PID > /dev/null 2>&1; then
      echo "✅ Listener process is running (PID: $PID)"
      echo "📄 Log file: $LOG_FILE"
      echo ""
      echo "📊 Recent logs:"
      tail -5 "$LOG_FILE"
    else
      echo "⚠️  PID file exists but process is not running"
    fi
  else
    echo "ℹ️  Listener process not running"
  fi
}

logs() {
  if [ -f "$LOG_FILE" ]; then
    tail -50 "$LOG_FILE"
  else
    echo "ℹ️  Log file does not exist"
  fi
}

case "$COMMAND" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  status)
    status
    ;;
  logs)
    logs
    ;;
  restart)
    stop
    start
    ;;
  *)
    echo "Usage: $0 {start|stop|status|logs|restart}"
    echo ""
    echo "Commands:"
    echo "  start   - Start listener process"
    echo "  stop    - Stop listener process"
    echo "  status  - Check running status"
    echo "  logs    - View recent logs"
    echo "  restart - Restart listener process"
    exit 1
    ;;
esac
