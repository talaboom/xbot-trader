from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID
import secrets

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.system import System
from app.schemas.system import SystemRegister, SystemHeartbeat


class SystemService:
    @staticmethod
    async def register_system(
        session: AsyncSession,
        system_data: SystemRegister
    ) -> tuple[System, str]:
        """Register a new system and return the system + generated API key."""
        api_key = secrets.token_urlsafe(32)

        system = System(
            name=system_data.name,
            os_type=system_data.os_type,
            hostname=system_data.hostname,
            ip_address=system_data.ip_address,
            api_key=api_key,
            is_active=True,
        )

        session.add(system)
        await session.flush()
        return system, api_key

    @staticmethod
    async def get_system_by_id(session: AsyncSession, system_id: UUID) -> Optional[System]:
        """Get a system by ID."""
        result = await session.execute(
            select(System).where(System.id == system_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_system_by_api_key(session: AsyncSession, api_key: str) -> Optional[System]:
        """Get a system by API key."""
        result = await session.execute(
            select(System).where(System.api_key == api_key)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_systems(session: AsyncSession, active_only: bool = False) -> list[System]:
        """Get all systems."""
        query = select(System)
        if active_only:
            query = query.where(System.is_active == True)
        result = await session.execute(query)
        return result.scalars().all()

    @staticmethod
    async def update_heartbeat(
        session: AsyncSession,
        system_id: UUID,
        status_data: Optional[dict] = None
    ) -> Optional[System]:
        """Update system heartbeat timestamp and status data."""
        system = await SystemService.get_system_by_id(session, system_id)
        if not system:
            return None

        system.last_heartbeat = datetime.utcnow()
        if status_data:
            system.status_data = status_data

        await session.flush()
        return system

    @staticmethod
    async def get_active_systems(session: AsyncSession) -> list[System]:
        """Get systems that have heartbeat within last 5 minutes."""
        cutoff_time = datetime.utcnow() - timedelta(minutes=5)
        result = await session.execute(
            select(System).where(
                and_(
                    System.is_active == True,
                    System.last_heartbeat >= cutoff_time
                )
            )
        )
        return result.scalars().all()

    @staticmethod
    async def deactivate_system(session: AsyncSession, system_id: UUID) -> Optional[System]:
        """Deactivate a system."""
        system = await SystemService.get_system_by_id(session, system_id)
        if system:
            system.is_active = False
            await session.flush()
        return system

    @staticmethod
    async def delete_system(session: AsyncSession, system_id: UUID) -> bool:
        """Delete a system."""
        system = await SystemService.get_system_by_id(session, system_id)
        if system:
            await session.delete(system)
            await session.flush()
            return True
        return False
