from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.system import System
from app.schemas.system import (
    SystemRegister,
    SystemStatusResponse,
    SystemListResponse,
    CommandDispatch,
    CommandResponse,
    SSHCommand,
    SSHCommandResponse,
)
from app.services.system_service import SystemService

router = APIRouter(prefix="/api-plus", tags=["api-plus"])


@router.post("/systems/register", response_model=dict)
async def register_system(
    system_data: SystemRegister,
    db: AsyncSession = Depends(get_db),
):
    """Register a new system and get its API key."""
    system, api_key = await SystemService.register_system(db, system_data)
    await db.commit()

    return {
        "id": str(system.id),
        "name": system.name,
        "api_key": api_key,
        "message": "System registered successfully. Save the API key securely.",
    }


@router.get("/systems", response_model=SystemListResponse)
async def list_systems(
    db: AsyncSession = Depends(get_db),
):
    """List all registered systems and their status."""
    systems = await SystemService.get_all_systems(db)
    return SystemListResponse(
        systems=[SystemStatusResponse.from_orm(s) for s in systems],
        total=len(systems),
    )


@router.get("/systems/active", response_model=SystemListResponse)
async def list_active_systems(
    db: AsyncSession = Depends(get_db),
):
    """List systems that are currently active (heartbeat within 5 minutes)."""
    systems = await SystemService.get_active_systems(db)
    return SystemListResponse(
        systems=[SystemStatusResponse.from_orm(s) for s in systems],
        total=len(systems),
    )


@router.get("/systems/{system_id}", response_model=SystemStatusResponse)
async def get_system_status(
    system_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get status of a specific system."""
    import uuid
    try:
        system_uuid = uuid.UUID(system_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid system ID format")

    system = await SystemService.get_system_by_id(db, system_uuid)
    if not system:
        raise HTTPException(status_code=404, detail="System not found")

    return SystemStatusResponse.from_orm(system)


@router.post("/systems/heartbeat")
async def system_heartbeat(
    heartbeat_data: dict,
    db: AsyncSession = Depends(get_db),
):
    """System sends heartbeat to indicate it's alive."""
    api_key = heartbeat_data.get("api_key")
    if not api_key:
        raise HTTPException(status_code=400, detail="API key required")

    system = await SystemService.get_system_by_api_key(db, api_key)
    if not system:
        raise HTTPException(status_code=401, detail="Invalid API key")

    status_data = heartbeat_data.get("status_data")
    await SystemService.update_heartbeat(db, system.id, status_data)
    await db.commit()

    return {"message": "Heartbeat received", "system_id": str(system.id)}


@router.post("/dispatch")
async def dispatch_command(
    command: CommandDispatch,
    db: AsyncSession = Depends(get_db),
):
    """Dispatch a command to a system.

    In a real implementation, this would route the command to the target system
    and wait for execution. For now, it returns a placeholder response.
    """
    system = await SystemService.get_system_by_id(db, command.system_id)
    if not system:
        raise HTTPException(status_code=404, detail="System not found")

    if not system.is_active:
        raise HTTPException(status_code=503, detail="System is not active")

    # TODO: Implement actual command routing to the system
    # This would involve sending the command to the system's agent
    # and waiting for a response

    return CommandResponse(
        success=True,
        message=f"Command dispatched to system {system.name}",
        data={"system_id": str(system.id), "command": command.command},
    )


@router.delete("/systems/{system_id}")
async def deactivate_system(
    system_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a system."""
    import uuid
    try:
        system_uuid = uuid.UUID(system_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid system ID format")

    system = await SystemService.deactivate_system(db, system_uuid)
    if not system:
        raise HTTPException(status_code=404, detail="System not found")

    await db.commit()
    return {"message": "System deactivated", "system_id": str(system.id)}


@router.post("/ssh/command", response_model=SSHCommandResponse)
async def execute_ssh_command(
    ssh_cmd: SSHCommand,
    db: AsyncSession = Depends(get_db),
):
    """Execute a command on a remote system via SSH.

    The source system (Claude) must have SSH access to the target system.
    This endpoint routes the command to the source system's agent,
    which will execute it and return the result.
    """
    source = await SystemService.get_system_by_id(db, ssh_cmd.source_system_id)
    if not source:
        raise HTTPException(status_code=404, detail="Source system not found")

    target = await SystemService.get_system_by_id(db, ssh_cmd.target_system_id)
    if not target:
        raise HTTPException(status_code=404, detail="Target system not found")

    if not target.ssh_enabled:
        raise HTTPException(status_code=403, detail="Target system doesn't have SSH enabled")

    if not target.ssh_user or not target.ip_address:
        raise HTTPException(status_code=400, detail="Target system missing SSH configuration")

    # TODO: Implement actual SSH command routing
    # The source system's agent will use this to execute commands on target
    # For now, return a placeholder response

    return SSHCommandResponse(
        success=True,
        message=f"SSH command queued for execution on {target.name}",
        stdout="",
        stderr="",
        exit_code=None,
    )
