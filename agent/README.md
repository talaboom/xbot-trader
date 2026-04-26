# System Agent

The System Agent runs on each of your systems (Windows, Linux, ParrotOS, Debian) and communicates with the central API Plus hub. It handles:

- **System Registration** — Registers itself with the central API Plus on first run
- **Heartbeat Monitoring** — Sends periodic status updates
- **Command Execution** — Executes commands locally or via SSH on other systems
- **SSH Tunneling** — Enables cross-system command execution (e.g., Windows → ParrotOS)

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Create Configuration

Copy `.env.example` to `.env.agent` and configure:

```bash
cp .env.example .env.agent
```

Edit `.env.agent` with your system details:

```ini
API_PLUS_URL=http://192.168.1.100:8000          # Main laptop IP:port
SYSTEM_NAME=ParrotOS Laptop
SYSTEM_HOSTNAME=parrot-laptop
OS_TYPE=parrot
IP_ADDRESS=192.168.1.50
SSH_USER=root
SSH_KEY_PATH=/home/user/.ssh/id_rsa
```

### 3. Generate SSH Key (if not exists)

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
```

### 4. Run the Agent

```bash
python main.py
```

On first run:
- Agent registers itself with API Plus
- Gets assigned an API key
- API key is saved to `.env.agent`
- Agent starts sending heartbeats every 30 seconds

## Architecture

```
ParrotOS System          Windows System          Linux System
[System Agent] ------->  [System Agent]  ------>  [System Agent]
      |                        |                        |
      +--------- API Plus Hub (Central) --------+
```

When you ask Claude on Windows to "fix ParrotOS":
1. Claude queries API Plus for ParrotOS connection info
2. Asks Windows System Agent to SSH into ParrotOS
3. Windows Agent executes the command via SSH
4. Result is reported back to you

## Configuration Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `API_PLUS_URL` | `http://localhost:8000` | Central API Plus server |
| `SYSTEM_NAME` | Hostname | Human-readable system name |
| `OS_TYPE` | Detected | `linux`, `debian`, `windows`, `parrot` |
| `SSH_USER` | `root` | Username for SSH access |
| `SSH_PORT` | `22` | SSH port |
| `SSH_KEY_PATH` | None | Path to SSH private key |
| `HEARTBEAT_INTERVAL` | `30` | Seconds between heartbeats |
| `API_KEY` | Auto-generated | Set by agent on registration |
| `ENABLE_HEALTH_CHECK` | `false` | Enable service health monitoring |
| `HEALTH_CHECK_INTERVAL` | `14400` | Health check interval (seconds, default 4 hours) |
| `HEALTH_CHECK_URL` | None | HTTP endpoint to check (e.g., http://localhost:8000/health) |
| `HEALTH_CHECK_COMMAND` | None | Shell command to check status (e.g., systemctl is-active xbot-trader) |
| `RECOVERY_COMMAND` | None | Command to run if service is down (e.g., systemctl restart xbot-trader) |
| `ALERT_WEBHOOK` | None | Webhook URL to send alerts to when service status changes |

## Health Monitoring

The agent can automatically monitor a service and restart it if it crashes. This is useful for services like xbot-trader.

### Setup Health Monitoring

1. **Enable health checks** in `.env.agent`:
```ini
ENABLE_HEALTH_CHECK=true
HEALTH_CHECK_INTERVAL=14400       # Check every 4 hours
HEALTH_CHECK_URL=http://localhost:8000/health
RECOVERY_COMMAND=systemctl restart xbot-trader
ALERT_WEBHOOK=https://your-alerts.com/webhook
```

2. **Agent will**:
   - Check service health every 4 hours
   - If service is DOWN → Automatically restart it
   - If restart succeeds → Log recovery, send alert
   - If restart fails → Send alert "Service down, needs attention"

3. **You only get notified when**:
   - Service crashes and recovers (good news!)
   - Service crashes and CAN'T be auto-restarted (needs you)

### Example: Monitor xbot-trader.ca

```ini
ENABLE_HEALTH_CHECK=true
HEALTH_CHECK_INTERVAL=14400
HEALTH_CHECK_URL=http://localhost:8000/health
HEALTH_CHECK_COMMAND=systemctl is-active xbot-trader
RECOVERY_COMMAND=systemctl restart xbot-trader
ALERT_WEBHOOK=https://your-discord-webhook.com/webhooks/xxx
```

The agent will check every 4 hours. If xbot-trader crashes, it automatically restarts and notifies you.

## Running as a Service (Linux/ParrotOS)

### Using systemd

Create `/etc/systemd/system/system-agent.service`:

```ini
[Unit]
Description=API Plus System Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/agent
ExecStart=/usr/bin/python3 /path/to/agent/main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl enable system-agent
sudo systemctl start system-agent
sudo systemctl status system-agent
```

### Using nohup (Quick start)

```bash
nohup python main.py > agent.log 2>&1 &
```

## Running on Windows

### As a scheduled task

```powershell
$action = New-ScheduledTaskAction -Execute "python" -Argument "C:\path\to\main.py"
$trigger = New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "SystemAgent" -RunLevel Highest
```

## Debugging

View logs:

```bash
# For systemd service
sudo journalctl -u system-agent -f

# For nohup
tail -f agent.log

# Or run directly with debug logging
LOGLEVEL=DEBUG python main.py
```

## Firewall

Ensure these ports are accessible between systems:
- **22** (SSH) — For cross-system commands
- **8000** (API Plus) — Communication with central hub

## Security Notes

- Keep SSH private keys secure and backed up
- API keys are auto-generated and unique per system
- All communication should use HTTPS in production
- Restrict SSH access to trusted networks
