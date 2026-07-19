from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from database import query, query_one, execute, execute_returning, log_audit
from auth import auth_required, require_role

router = APIRouter(prefix="/api/org-classifications", tags=["org-classifications"])

DEFAULTS = [
    "Private Limited Company", "Public Limited Company", "Partnership Firm",
    "Sole Proprietorship", "LLP (Limited Liability Partnership)",
    "Society / Trust / NGO", "Government Institution", "Autonomous Body",
]


async def _seed_defaults():
    count_row = await query_one("SELECT COUNT(*) c FROM org_classifications")
    if count_row and int(count_row["c"] or 0) == 0:
        for i, name in enumerate(DEFAULTS):
            await execute(
                "INSERT INTO org_classifications (name, is_enabled, is_system, sort_order) VALUES ($1, 1, 1, $2) ON CONFLICT (name) DO NOTHING",
                [name, i + 1],
            )


@router.get("")
async def list_classifications():
    await _seed_defaults()
    rows = await query("SELECT * FROM org_classifications ORDER BY sort_order, id")
    return rows


class ClassificationIn(BaseModel):
    name: str


@router.post("")
async def create_classification(body: ClassificationIn, user: dict = Depends(require_role("superadmin"))):
    name = body.name.strip()
    if not name:
        raise HTTPException(400, "Name is required")
    existing = await query_one("SELECT id FROM org_classifications WHERE name=$1", [name])
    if existing:
        raise HTTPException(400, "Already exists")
    max_row = await query_one("SELECT MAX(sort_order) m FROM org_classifications")
    max_order = int(max_row["m"] or 0) if max_row else 0
    row = await execute_returning(
        "INSERT INTO org_classifications (name, is_enabled, is_system, sort_order) VALUES ($1, 1, 0, $2) RETURNING *",
        [name, max_order + 1],
    )
    await log_audit(user, "Org classification added", "org_classification", row["id"], name)
    return row


class StatusIn(BaseModel):
    is_enabled: bool


@router.patch("/{id}/status")
async def set_status(id: int, body: StatusIn, user: dict = Depends(require_role("superadmin"))):
    row = await query_one("SELECT * FROM org_classifications WHERE id=$1", [id])
    if not row:
        raise HTTPException(404, "Not found")
    await execute("UPDATE org_classifications SET is_enabled=$1 WHERE id=$2", [1 if body.is_enabled else 0, id])
    action = "Org classification enabled" if body.is_enabled else "Org classification disabled"
    await log_audit(user, action, "org_classification", id, row["name"])
    return {**row, "is_enabled": 1 if body.is_enabled else 0}


class RenameIn(BaseModel):
    name: str


@router.put("/{id}")
async def rename_classification(id: int, body: RenameIn, user: dict = Depends(require_role("superadmin"))):
    name = body.name.strip()
    if not name:
        raise HTTPException(400, "Name is required")
    row = await query_one("SELECT * FROM org_classifications WHERE id=$1", [id])
    if not row:
        raise HTTPException(404, "Not found")
    dup = await query_one("SELECT id FROM org_classifications WHERE name=$1 AND id!=$2", [name, id])
    if dup:
        raise HTTPException(400, "Name already in use")
    await execute("UPDATE org_classifications SET name=$1 WHERE id=$2", [name, id])
    await log_audit(user, "Org classification renamed", "org_classification", id, f"{row['name']} → {name}")
    return {**row, "name": name}


@router.delete("/{id}")
async def delete_classification(id: int, user: dict = Depends(require_role("superadmin"))):
    row = await query_one("SELECT * FROM org_classifications WHERE id=$1", [id])
    if not row:
        raise HTTPException(404, "Not found")
    if row.get("is_system"):
        raise HTTPException(400, "Cannot delete a system classification")
    await execute("DELETE FROM org_classifications WHERE id=$1", [id])
    await log_audit(user, "Org classification deleted", "org_classification", id, row["name"])
    return {"ok": True}
