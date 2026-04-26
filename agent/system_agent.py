import asyncio
import logging
import json
import platform
import socket
import subprocess
from datetime import datetime
from typing import Optional, Dict, Any
from pathlib import Path

import aiohttp
import paramiko
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class SystemConfig(BaseModel):
    api_url: str
    system_name: str
    system_hostname: str
    os_type: str
    ip_address: str
    ssh_user: Optional[str] = None
    ssh_port: str = "22"
    ssh_key_path: Optional[str] = None
    api_key: Optional[str] = None
    heartbeat_interval: int = 30


class SystemAgent:
    def __init__(self, config: SystemConfig):
        self.config = config
        self.api_url = config.api_url.rstrip("/")
        self.session: Optional[aiohttp.ClientSession] = None
        self.ssh_client: Optional[paramiko.SSHClient] = None
        self.running = False

    async def initialize(self) -> bool:
        """Initialize the agent, register if needed, and set up SSH client."""
        self.session = aiohttp.ClientSession()

        if not self.config.api_key:
            logger.info(f"Registering system: {self.config.system_name}")
            success = await self.register_system()
            if not success:
                logger.error("Failed to register system")
                return False
        else:
            logger.info(f"Using existing API key for {self.config.system_name}")

        if self.config.ssh_key_path and Path(self.config.ssh_key_path).exists():
            self._setup_ssh_client()

        return True

    async def register_system(self) -> bool:
        """Register this system with API Plus."""
        try:
            payload = {
                "name": self.config.system_name,
                "os_type": self.config.os_type,
                "hostname": self.config.system_hostname,
                "ip_address": self.config.ip_address,
                "ssh_user": self.config.ssh_user,
                "ssh_port": self.config.ssh_port,
                "ssh_enabled": bool(self.config.ssh_key_path),
            }

            async with self.session.post(
                f"{self.api_url}/api/v1/api-plus/systems/register",
                json=payload,
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self.config.api_key = data["api_key"]
                    logger.info(f"System registered with API key: {data['api_key']}")

                    # Save API key to .env for persistence
                    self._save_api_key(data["api_key"])
                    return True
                else:
                    logger.error(f"Registration failed: {await resp.text()}")
                    return False
        except Exception as e:
            logger.error(f"Registration error: {e}")
            return False

    def _save_api_key(self, api_key: str):
        """Save API key to .env file for persistence."""
        env_file = Path(".env.agent")
        content = f"API_KEY={api_key}\n"
        env_file.write_text(content)
        logger.info(f"API key saved to {env_file}")

    def _setup_ssh_client(self):
        """Initialize SSH client with private key."""
        try:
            self.ssh_client = paramiko.SSHClient()
            self.ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            logger.info(f"SSH client configured with key: {self.config.ssh_key_path}")
        except Exception as e:
            logger.error(f"SSH client setup failed: {e}")

    async def send_heartbeat(self):
        """Send periodic heartbeat with system status."""
        while self.running:
            try:
                status_data = self._get_system_status()

                payload = {
                    "api_key": self.config.api_key,
                    "status_data": status_data,
                }

                async with self.session.post(
                    f"{self.api_url}/api/v1/api-plus/systems/heartbeat",
                    json=payload,
                ) as resp:
                    if resp.status == 200:
                        logger.debug("Heartbeat sent successfully")
                    else:
                        logger.warning(f"Heartbeat failed: {resp.status}")

            except Exception as e:
                logger.error(f"Heartbeat error: {e}")

            await asyncio.sleep(self.config.heartbeat_interval)

    def _get_system_status(self) -> Dict[str, Any]:
        """Get current system status."""
        try:
            import psutil
        except ImportError:
            logger.warning("psutil not installed, using basic status")
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "status": "online",
            }

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "status": "online",
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory": psutil.virtual_memory()._asdict(),
            "disk": psutil.disk_usage("/")._asdict(),
        }

    async def listen_for_commands(self):
        """Poll API Plus for commands to execute."""
        while self.running:
            try:
                # TODO: Implement command polling mechanism
                # This would periodically check for pending commands
                await asyncio.sleep(5)
            except Exception as e:
                logger.error(f"Command listening error: {e}")

    async def execute_ssh_command(
        self, target_host: str, command: str, target_user: str, target_port: str = "22"
    ) -> Dict[str, Any]:
        """Execute a command on a remote system via SSH."""
        if not self.ssh_client:
            return {
                "success": False,
                "error": "SSH client not configured",
                "stdout": "",
                "stderr": "",
            }

        try:
            self.ssh_client.connect(
                target_host,
                port=int(target_port),
                username=target_user,
                key_filename=self.config.ssh_key_path,
                timeout=10,
            )

            stdin, stdout, stderr = self.ssh_client.exec_command(command, timeout=30)
            out = stdout.read().decode().strip()
            err = stderr.read().decode().strip()
            exit_code = stdout.channel.recv_exit_status()

            self.ssh_client.close()

            return {
                "success": exit_code == 0,
                "stdout": out,
                "stderr": err,
                "exit_code": exit_code,
            }

        except Exception as e:
            logger.error(f"SSH command failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "stdout": "",
                "stderr": str(e),
            }

    async def execute_local_command(self, command: str) -> Dict[str, Any]:
        """Execute a command locally."""
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=30,
            )

            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "exit_code": result.returncode,
            }

        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Command timeout",
                "stdout": "",
                "stderr": "Command execution timeout",
            }
        except Exception as e:
            logger.error(f"Local command failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "stdout": "",
                "stderr": str(e),
            }

    async def run(self):
        """Start the system agent."""
        logger.info(f"Starting system agent for {self.config.system_name}")
        self.running = True

        try:
            if not await self.initialize():
                logger.error("Initialization failed")
                return

            # Run heartbeat and command listener concurrently
            await asyncio.gather(
                self.send_heartbeat(),
                self.listen_for_commands(),
            )

        except Exception as e:
            logger.error(f"Agent error: {e}")
        finally:
            self.running = False
            if self.session:
                await self.session.close()
            if self.ssh_client:
                self.ssh_client.close()

    async def stop(self):
        """Stop the system agent."""
        logger.info("Stopping system agent")
        self.running = False
