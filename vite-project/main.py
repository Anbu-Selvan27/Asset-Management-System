from importlib import metadata
from io import BytesIO
from typing import Dict, List
from docx import Document
from fastapi import APIRouter, FastAPI,  Depends, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse
import pandas as pd
from sqlalchemy import Column, Engine, String, Table, inspect
from sqlalchemy.orm import Session, joinedload
from asset import  add_fields_to_category, create_category, add_asset, delete_asset, delete_category, delete_field_from_category, get_categories,normalize_column_name,upload_excel_and_create_tables
from auth import get_current_user, login_user, register_user, require_admin
from models import  Base, CategoryInfo,SessionLocal, User,get_db 
from fastapi import Body
from fastapi import Query
from asset import search_asset
from schemas import CategoryCreate, AssetInput, CategoryDelete,  FieldDeleteRequest, ReassignAssetInput, UserCreate
from schemas import UserLogin, TokenResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import text


app = FastAPI()


# Allow CORS for your React app (default Vite runs on port 5173)
origins = [
    "http://localhost:5173",  # React Vite dev server
    "http://127.0.0.1:5173",
    # You can also add your deployed frontend URL here later
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- CREATE CATEGORY ENDPOINT ----------
@app.post("/create-category")
def create_category_endpoint(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create categories")
    return create_category(data, db)


# 🚀 Get all categories and their fields
@app.get("/get-categories")
def get_categories_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can get categories")
    return get_categories(db)


@app.post("/add-fields")
def add_fields_endpoint(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can add fields")
    return add_fields_to_category(data, db)

@app.post("/delete-field")
def delete_field_endpoint(
    request: FieldDeleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete fields")
    return delete_field_from_category(request.category_name, request.field_name, db)

@app.post("/delete-category")
def delete_category_endpoint(
    data: CategoryDelete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete categories")
    return delete_category(data, db)

#  Insert data into dynamic table
@app.post("/add-asset")
def add_asset_endpoint(
    asset: AssetInput = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can add assets")
    return add_asset(asset, db)


@app.post("/upload-excel")
def upload_excel_endpoint(file: UploadFile = File(...), db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can upload excel data")
    return upload_excel_and_create_tables(file, db)



@app.get("/admin-only")
def admin_route(user=Depends(require_admin)):
    return {"message": f"Welcome admin {user['username']}"}


@app.post("/register")
def register(data: UserCreate, db: Session = Depends(get_db)):
    # Check if the current user is an admin

    return register_user(data, db)



@app.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    return login_user(form_data, db)


@app.get("/search-asset")
def search_asset_endpoint(
    table_name: str = Query(..., description="Table name to search (e.g., laptop, mobile)"),
    identifier: str = Query(..., description="Asset Tag or Asset Code"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Access forbidden: Admins only")

    return search_asset(table_name, identifier, db)

@app.delete("/delete-asset")
def delete_asset_endpoint(
    table_name: str = Query(..., description="Table name to delete from (e.g., laptop, mobile)"),
    identifier: str = Query(..., description="Asset Tag or Asset Code"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Ensure that the user is an admin
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Access forbidden: Admins only")

    # Call the delete_asset function to handle the deletion
    return delete_asset(table_name, identifier, db)

def check_asset_column_exists(table_name: str, db_session, column_name: str):
    # Query to check if the column exists in the given table
    query = text(f"PRAGMA table_info({table_name});")
    result = db_session.execute(query).fetchall()
    
    # Check if the column exists in the result (column name is at index 1 in the tuple)
    for column in result:
        if column[1] == column_name:  # column[1] is the name of the column
            return True
    return False
@app.put("/reassign-asset")
async def reassign_asset(data: ReassignAssetInput, db: Session = Depends(get_db)):
    if not check_asset_column_exists(data.table_name, db, 'asset_tag') and not check_asset_column_exists(data.table_name, db, 'asset_code'):
        raise HTTPException(
            status_code=400,
            detail="Table must have either 'asset tag' or 'asset code' column."
        )

    update_fields = {
        "user_name": data.user_name,
        "user_id": data.user_id,
        "email": data.email,
        "department": data.department,
        "location": data.location,
        "section": data.section,
        "date_of_return": data.date_of_return,
        "date_of_reassign": data.date_of_reassign,
        "date_of_update": data.date_of_update,
        "remarks": data.remarks,
    }

    # Check if all fields exist in the table before proceeding
    missing_fields = [
        field for field in update_fields.keys()
        if not check_asset_column_exists(data.table_name, db, field)
    ]
    if missing_fields:
        raise HTTPException(
            status_code=400,
            detail=f"The following fields are missing in the table '{data.table_name}': {', '.join(missing_fields)}"
        )

    # Now handle the actual asset reassignment
    result = db.execute(text(f'''
        SELECT * FROM "{data.table_name}"
        WHERE "asset_tag" = :identifier OR "asset_code" = :identifier
    '''), {"identifier": data.identifier})
    asset = result.fetchone()

    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    valid_fields = {k: v for k, v in update_fields.items() if v is not None}
    if not valid_fields:
        raise HTTPException(status_code=400, detail="No valid fields to update.")

    set_clause = ", ".join([f'"{key}" = :{key}' for key in valid_fields])
    update_query = text(f'''
        UPDATE "{data.table_name}"
        SET {set_clause}
        WHERE "asset_tag" = :identifier OR "asset_code" = :identifier
    ''')

    valid_fields["identifier"] = data.identifier
    db.execute(update_query, valid_fields)
    db.commit()

    return {"message": f"Asset reassigned in table '{data.table_name}' for identifier '{data.identifier}'"}


@app.get("/download-table")
def download_table(
    table_name: str = Query(..., description="Name of the table to export"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Access forbidden: Admins only")

    # Normalize user input
    normalized_table_name = table_name.strip().lower().replace(" ", "_")

    excluded_tables = {"category_info", "users"}

    try:
        if normalized_table_name in excluded_tables:
            raise HTTPException(status_code=400, detail=f"Export of '{normalized_table_name}' is not allowed")

        inspector = inspect(db.bind)
        if normalized_table_name not in inspector.get_table_names():
            raise HTTPException(status_code=404, detail="Table not found")

        df = pd.read_sql_table(normalized_table_name, db.bind)
        excel_buffer = BytesIO()

        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=normalized_table_name, index=False)

        excel_buffer.seek(0)
        return StreamingResponse(
            excel_buffer,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={"Content-Disposition": f"attachment; filename={normalized_table_name}.xlsx"}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/dashboard-stats")
def dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Access forbidden: Admins only")

    # Total categories
    categories = db.query(CategoryInfo).all()
    total_categories = len(categories)

    # Total users
    total_users = db.query(User).count()

    # Asset stats
    total_assets = 0
    asset_counts_by_category: Dict[str, int] = {}
    active_asset_counts_by_category: Dict[str, int] = {}

    for cat in categories:
        table_name = cat.tablename
        try:
            # Count all assets
            total_query = text(f'SELECT COUNT(*) FROM "{table_name}"')
            total_count = db.execute(total_query).scalar()
            asset_counts_by_category[table_name] = total_count
            total_assets += total_count

            # Check if "status" column exists
            status_check_query = text(f"PRAGMA table_info('{table_name}')")
            columns = db.execute(status_check_query).fetchall()
            column_names = [col[1] for col in columns]

            if "asset_status" in column_names:
                active_query = text(f"SELECT COUNT(*) FROM '{table_name}' WHERE asset_status = 'Active'")
                active_count = db.execute(active_query).scalar()
            else:
                active_count = 0

            active_asset_counts_by_category[table_name] = active_count

        except Exception as e:
            asset_counts_by_category[table_name] = 0
            active_asset_counts_by_category[table_name] = 0

    return {
        "categories": total_categories,
        "assets": total_assets,
        "users": total_users,
        "asset_counts_by_category": asset_counts_by_category,
        "active_asset_counts_by_category": active_asset_counts_by_category
    }

