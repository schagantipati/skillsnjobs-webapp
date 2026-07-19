from fastapi import APIRouter, Depends, HTTPException
from database import query, query_one, execute, execute_returning
from auth import auth_required, require_role
from datetime import date

router = APIRouter(prefix="/api/placements", tags=["placements"])


@router.get("/my")
async def candidate_placements(user: dict = Depends(require_role("candidate"))):
    return await query("""SELECT p.*, a.name as agency_name, e.org_name as employer_org
        FROM placements p
        LEFT JOIN users a ON a.id=p.agency_id
        LEFT JOIN users e ON e.id=p.employer_id
        WHERE p.candidate_id=$1 ORDER BY p.placement_date DESC""", [user["id"]])


@router.get("/mine")
async def my_placements(user: dict = Depends(require_role("placement_agency", "admin", "superadmin"))):
    is_admin = user["role"] in ["admin", "superadmin"]
    if is_admin:
        return await query("""SELECT p.*, u.name as candidate_name, u.email as candidate_email,
            e.name as employer_name, e.org_name
            FROM placements p JOIN users u ON u.id=p.candidate_id
            LEFT JOIN users e ON e.id=p.employer_id
            ORDER BY p.placement_date DESC""")
    return await query("""SELECT p.*, u.name as candidate_name, u.email as candidate_email,
        e.name as employer_name, e.org_name
        FROM placements p JOIN users u ON u.id=p.candidate_id
        LEFT JOIN users e ON e.id=p.employer_id
        WHERE p.agency_id=$1 ORDER BY p.placement_date DESC""", [user["id"]])


@router.get("/summary")
async def summary(user: dict = Depends(require_role("placement_agency", "admin", "superadmin"))):
    is_admin = user["role"] in ["admin", "superadmin"]
    cur_year = str(date.today().year)
    if is_admin:
        total = await query_one("SELECT COUNT(*) c, AVG(ctc) avg_ctc FROM placements")
        this_year = await query_one("SELECT COUNT(*) c FROM placements WHERE LEFT(placement_date::text,4)=$1", [cur_year])
        joined = await query_one("SELECT COUNT(*) c FROM placements WHERE status='joined'")
    else:
        aid = user["id"]
        total = await query_one("SELECT COUNT(*) c, AVG(ctc) avg_ctc FROM placements WHERE agency_id=$1", [aid])
        this_year = await query_one("SELECT COUNT(*) c FROM placements WHERE agency_id=$1 AND LEFT(placement_date::text,4)=$2", [aid, cur_year])
        joined = await query_one("SELECT COUNT(*) c FROM placements WHERE agency_id=$1 AND status='joined'", [aid])
    return {
        "total": int(total["c"] or 0),
        "avg_ctc": round(float(total["avg_ctc"])) if total.get("avg_ctc") else 0,
        "this_year": int(this_year["c"] or 0),
        "joined": int(joined["c"] or 0),
    }


@router.post("", status_code=201)
async def create_placement(body: dict, user: dict = Depends(require_role("placement_agency", "admin"))):
    if not body.get("candidate_id") or not body.get("job_title"):
        raise HTTPException(400, detail="candidate_id and job_title are required")
    row = await execute_returning("""INSERT INTO placements
        (agency_id,candidate_id,employer_id,job_title,company,location,ctc,placement_date,status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *""",
        [user["id"], body["candidate_id"], body.get("employer_id"),
         body["job_title"], body.get("company", ""), body.get("location", ""),
         body.get("ctc"), body.get("placement_date") or date.today().isoformat(), body.get("status", "placed")])
    return row


@router.put("/{pid}")
async def update_placement(pid: int, body: dict, user: dict = Depends(require_role("placement_agency", "admin"))):
    pl = await query_one("SELECT * FROM placements WHERE id=$1", [pid])
    if not pl: raise HTTPException(404, detail="Placement not found")
    if user["role"] != "admin" and pl["agency_id"] != user["id"]:
        raise HTTPException(403, detail="Not your placement")
    await execute("""UPDATE placements SET job_title=$1,company=$2,location=$3,ctc=$4,placement_date=$5,status=$6 WHERE id=$7""",
        [body.get("job_title") or pl["job_title"], body.get("company") or pl.get("company"),
         body.get("location") or pl.get("location"),
         body.get("ctc") if "ctc" in body else pl.get("ctc"),
         body.get("placement_date") or pl.get("placement_date"),
         body.get("status") or pl.get("status"), pid])
    return await query_one("SELECT * FROM placements WHERE id=$1", [pid])


@router.delete("/{pid}", status_code=204)
async def delete_placement(pid: int, user: dict = Depends(require_role("placement_agency", "admin"))):
    pl = await query_one("SELECT * FROM placements WHERE id=$1", [pid])
    if not pl: raise HTTPException(404, detail="Placement not found")
    if user["role"] != "admin" and pl["agency_id"] != user["id"]:
        raise HTTPException(403, detail="Not your placement")
    await execute("DELETE FROM placements WHERE id=$1", [pid])
