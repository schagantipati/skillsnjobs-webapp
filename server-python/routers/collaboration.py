import json
from fastapi import APIRouter, Depends, HTTPException
from database import query, query_one, execute, execute_returning, log_audit
from auth import auth_required

router = APIRouter(prefix="/api/collaboration", tags=["collaboration"])


def _vendor_only(user: dict):
    if user["role"] != "training_vendor":
        raise HTTPException(403, detail="Training vendor only")


@router.get("/consortium")
async def consortium(user: dict = Depends(auth_required)):
    rows = await query("""SELECT u.id, u.name AS org_name, u.city, u.state_name,
        u.role, u.created_at, u.vendor_profile
        FROM users u WHERE u.role='training_vendor' AND u.id!=$1""", [user["id"]])
    partners = []
    for r in rows:
        vp = r.get("vendor_profile")
        if isinstance(vp, str):
            try: vp = json.loads(vp)
            except Exception: vp = {}
        vp = vp or {}
        s1 = vp.get("step1") or {}
        s4 = vp.get("step4") or {}
        partners.append({
            "id": r["id"], "org_name": r["org_name"], "type": "Training Partner",
            "sector": s1.get("sector") or "Multiple",
            "state": s1.get("headState") or r.get("state_name") or "—",
            "city": s1.get("headCity") or r.get("city") or "—",
            "accreditation": s4.get("nsdc") or s4.get("ssc"),
            "member_since": r.get("created_at"),
        })
    return partners


@router.get("/invitations")
async def get_invitations(user: dict = Depends(auth_required)):
    _vendor_only(user)
    received = await query("""SELECT i.*, u.name AS from_org_name
        FROM collab_invitations i JOIN users u ON u.id=i.from_vendor_id
        WHERE i.to_vendor_id=$1 ORDER BY i.created_at DESC""", [user["id"]])
    sent = await query("""SELECT i.*, COALESCE(u.name, i.to_org_name) AS to_org_name_resolved
        FROM collab_invitations i LEFT JOIN users u ON u.id=i.to_vendor_id
        WHERE i.from_vendor_id=$1 ORDER BY i.created_at DESC""", [user["id"]])
    return {"received": received, "sent": sent}


@router.post("/invitations", status_code=201)
async def send_invitation(body: dict, user: dict = Depends(auth_required)):
    _vendor_only(user)
    if not body.get("invitation_type") or not body.get("project_name"):
        raise HTTPException(400, detail="invitation_type and project_name are required")
    row = await execute_returning("""INSERT INTO collab_invitations
        (from_vendor_id,to_vendor_id,to_org_name,invitation_type,project_name,sector,state,message)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *""",
        [user["id"], body.get("to_vendor_id"), body.get("to_org_name"),
         body["invitation_type"], body["project_name"],
         body.get("sector"), body.get("state"), body.get("message")])
    await log_audit(user, "collab_invitation_sent", "collab_invitations", row["id"] if row else None)
    return row


@router.patch("/invitations/{iid}")
async def update_invitation(iid: int, body: dict, user: dict = Depends(auth_required)):
    _vendor_only(user)
    status = body.get("status")
    if status not in ["accepted", "rejected", "withdrawn"]:
        raise HTTPException(400, detail="Invalid status")
    if status == "withdrawn":
        row = await query_one("UPDATE collab_invitations SET status=$1 WHERE id=$2 AND from_vendor_id=$3 RETURNING *", [status, iid, user["id"]])
    else:
        row = await query_one("UPDATE collab_invitations SET status=$1 WHERE id=$2 AND to_vendor_id=$3 RETURNING *", [status, iid, user["id"]])
    if not row: raise HTTPException(404, detail="Invitation not found or not authorised")
    return row


@router.get("/partnership-requests")
async def get_partnership_requests(user: dict = Depends(auth_required)):
    all_req = await query("""SELECT r.*, u.name AS org_name, u.city, u.state_name,
        COUNT(rp.id) AS response_count
        FROM collab_partnership_requests r JOIN users u ON u.id=r.vendor_id
        LEFT JOIN collab_partnership_responses rp ON rp.request_id=r.id
        WHERE r.status='open'
        GROUP BY r.id, u.name, u.city, u.state_name
        ORDER BY r.created_at DESC""")
    mine = await query("""SELECT r.*, u.name AS org_name, COUNT(rp.id) AS response_count
        FROM collab_partnership_requests r JOIN users u ON u.id=r.vendor_id
        LEFT JOIN collab_partnership_responses rp ON rp.request_id=r.id
        WHERE r.vendor_id=$1
        GROUP BY r.id, u.name ORDER BY r.created_at DESC""", [user["id"]])
    return {"all": all_req, "mine": mine}


@router.post("/partnership-requests", status_code=201)
async def create_partnership_request(body: dict, user: dict = Depends(auth_required)):
    _vendor_only(user)
    if not body.get("looking_for"): raise HTTPException(400, detail="looking_for is required")
    row = await execute_returning("""INSERT INTO collab_partnership_requests
        (vendor_id,looking_for,sector,state,project_type,description)
        VALUES ($1,$2,$3,$4,$5,$6) RETURNING *""",
        [user["id"], body["looking_for"], body.get("sector"), body.get("state"),
         body.get("project_type"), body.get("description")])
    return row


@router.patch("/partnership-requests/{rid}/close")
async def close_partnership_request(rid: int, user: dict = Depends(auth_required)):
    _vendor_only(user)
    row = await query_one("UPDATE collab_partnership_requests SET status='closed' WHERE id=$1 AND vendor_id=$2 RETURNING *", [rid, user["id"]])
    if not row: raise HTTPException(404, detail="Request not found")
    return row


@router.post("/partnership-requests/{rid}/respond", status_code=201)
async def respond_to_request(rid: int, body: dict, user: dict = Depends(auth_required)):
    _vendor_only(user)
    row = await execute_returning("""INSERT INTO collab_partnership_responses (request_id, vendor_id, message)
        VALUES ($1,$2,$3) ON CONFLICT (request_id, vendor_id) DO UPDATE SET message=EXCLUDED.message RETURNING *""",
        [rid, user["id"], body.get("message")])
    return row


@router.get("/partnership-requests/{rid}/responses")
async def get_responses(rid: int, user: dict = Depends(auth_required)):
    _vendor_only(user)
    req_row = await query_one("SELECT * FROM collab_partnership_requests WHERE id=$1 AND vendor_id=$2", [rid, user["id"]])
    if not req_row: raise HTTPException(403, detail="Not authorised")
    return await query("""SELECT rp.*, u.name AS org_name, u.city, u.state_name
        FROM collab_partnership_responses rp JOIN users u ON u.id=rp.vendor_id
        WHERE rp.request_id=$1 ORDER BY rp.created_at DESC""", [rid])


@router.get("/resources")
async def get_resources(listing_type: str = None, user: dict = Depends(auth_required)):
    params = []
    where_parts = ["r.status != 'deleted'"]
    if listing_type:
        params.append(listing_type)
        where_parts.append(f"r.listing_type=${len(params)}")
    where = "WHERE " + " AND ".join(where_parts)
    all_res = await query(f"""SELECT r.*, u.name AS org_name, u.city, u.state_name
        FROM collab_resources r JOIN users u ON u.id=r.vendor_id {where}
        ORDER BY r.created_at DESC""", params)
    mine = await query("""SELECT r.*, u.name AS org_name FROM collab_resources r
        JOIN users u ON u.id=r.vendor_id WHERE r.vendor_id=$1 AND r.status!='deleted'
        ORDER BY r.created_at DESC""", [user["id"]])
    return {"all": all_res, "mine": mine}


@router.post("/resources", status_code=201)
async def create_resource(body: dict, user: dict = Depends(auth_required)):
    _vendor_only(user)
    if not body.get("resource_type") or not body.get("listing_type"):
        raise HTTPException(400, detail="resource_type and listing_type are required")
    row = await execute_returning("""INSERT INTO collab_resources
        (vendor_id,resource_type,qty,location,availability,sector,listing_type,details)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *""",
        [user["id"], body["resource_type"], body.get("qty", 1), body.get("location"),
         body.get("availability"), body.get("sector"), body["listing_type"], body.get("details")])
    return row


@router.delete("/resources/{rid}")
async def delete_resource(rid: int, user: dict = Depends(auth_required)):
    _vendor_only(user)
    row = await query_one("UPDATE collab_resources SET status='deleted' WHERE id=$1 AND vendor_id=$2 RETURNING id", [rid, user["id"]])
    if not row: raise HTTPException(404, detail="Resource not found")
    return {"success": True}


@router.post("/resources/{rid}/request", status_code=201)
async def request_resource(rid: int, body: dict, user: dict = Depends(auth_required)):
    _vendor_only(user)
    row = await execute_returning("""INSERT INTO collab_resource_requests
        (resource_id, vendor_id, qty_needed, required_dates, message)
        VALUES ($1,$2,$3,$4,$5) RETURNING *""",
        [rid, user["id"], body.get("qty_needed", 1), body.get("required_dates"), body.get("message")])
    return row
