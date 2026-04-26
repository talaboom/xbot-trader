#!/usr/bin/env python3
"""
System Agent - Runs on each system to coordinate with API Plus
Handles system registration, heartbeats, and remote command execution
"""

import asyncio
import logging
import platform
import socket
from pathlib import Path
from dotenv import load_dotenv
import os

from system_agent import SystemAgent, SystemConfig

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def get_system_info():
    """Get basic system information."""
    return {
        "hostname": socket.gethostname(),
        "os_type": platform.system().lower(),
        "ip_address": socket.gethostbyname(socket.gethostname()),
    }


def load_config():
    """Load configuration from environment variables."""
    load_dotenv(".env.agent")
    load_dotenv()

    system_info = get_system_info()

    config = SystemConfig(
        api_url=os.getenv("API_PLUS_URL", "http://localhost:8000"),
        system_name=os.getenv("SYSTEM_NAME", socket.gethostname()),
        system_hostname=os.getenv("SYSTEM_HOSTNAME", system_info["hostname"]),
        os_type=os.getenv("OS_TYPE", system_info["os_type"]),
        ip_address=os.getenv("IP_ADDRESS", system_info["ip_address"]),
        ssh_user=os.getenv("SSH_USER", "root"),
        ssh_port=os.getenv("SSH_PORT", "22"),
        ssh_key_path=os.getenv("SSH_KEY_PATH"),
        api_key=os.getenv("API_KEY"),
        heartbeat_interval=int(os.getenv("HEARTBEAT_INTERVAL", "30")),
    )

    return config


async def main():
    """Main entry point for the system agent."""
    logger.info("Initializing System Agent")

    config = load_config()
    logger.info(f"Configuration loaded: {config.system_name} ({config.os_type})")

    agent = SystemAgent(config)

    try:
        logger.info(f"Starting agent for {config.system_name}")
        await agent.run()
    except KeyboardInterrupt:
        logger.info("Received interrupt signal")
        await agent.stop()
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        await agent.stop()


if __name__ == "__main__":
    asyncio.run(main())
