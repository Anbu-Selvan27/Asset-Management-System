from datetime import datetime
import sqlalchemy
from sqlalchemy.orm import Session
import re
from models import Base, CategoryInfo, User, engine, get_db
from sqlalchemy import JSON, Boolean, Date, DateTime, Float, Integer, Table, Column, String, MetaData, insert, inspect
from fastapi import Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, List, Literal
from io import BytesIO
import pandas as pd
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.sql.elements import quoted_name
from schemas import AssetInput, CategoryCreate, CategoryDelete, ReassignAssetInput
import json

metadata = MetaData()

sql_type_map = {
    "string": String,
    "integer": Integer,
    "float": Float,
    "boolean": Boolean,
    "date": Date,
}

def create_category(data: CategoryCreate, db: Session):
    category = data.category_name.lower().replace(" ", "_")
    fields = data.fields

    if not fields:
        raise HTTPException(status_code=400, detail="At least one field is required")

    # Check for primary key: asset_tag or asset_code (standardize to lowercase with underscore)
    normalized_names = [f.name.lower().replace(" ", "_") for f in fields]
    if not any(name in ["asset_tag", "asset_code"] for name in normalized_names):
        raise HTTPException(
            status_code=400,
            detail="One of 'asset tag' or 'asset code' is required "
        )

    # Remove table metadata if already exists
    if category in metadata.tables:
        metadata.remove(metadata.tables[category])

    # Create columns
    columns = []
    for field in fields:
        raw_name = field.name
        name = raw_name.lower().replace(" ", "_")
        print(name)
        dtype = field.type.lower()

        # Map types
        if dtype == "string":
            col_type = String
        elif dtype == "integer":
            col_type = Integer
        elif dtype == "boolean":
            col_type = Boolean
        elif dtype == "date":
            col_type = Date
        else:
            col_type = String  # fallback

        # Set as primary key if asset_tag or asset_code
        is_primary = name in ["asset_tag", "asset_code"]
        columns.append(Column(name, col_type, primary_key=is_primary))

    # Create the table dynamically
    table = Table(category, metadata, *columns)
    try:
        table.create(bind=engine)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Table creation failed: {str(e)}")
    res =[]
    for field in fields:
        raw_name = field.name
        name = raw_name.lower().replace(" ", "_")
        res.append({"name":name,"type":field.type})


    
    # Store category info
    cat_info = CategoryInfo(
        tablename=category,
        tablefields=res # Store as provided
    )
    db.add(cat_info)
    db.commit()

    return {"message": f"Category '{category}' created successfully"}



def add_fields_to_category(data: CategoryCreate, db: Session):
    category = data.category_name.lower().replace(" ", "_")
    new_fields = data.fields  

    if not new_fields:
        raise HTTPException(status_code=400, detail="At least one new field is required")

    # Check if table exists
    if not engine.dialect.has_table(engine.connect(), category):
        raise HTTPException(status_code=404, detail=f"Table '{category}' does not exist")

    # Retrieve CategoryInfo from the database
    cat_info = db.query(CategoryInfo).filter_by(tablename=category).first()
    if not cat_info:
        raise HTTPException(status_code=404, detail="Category info not found")

    # Existing field names in CategoryInfo metadata
    existing_field_names = {f['name'] for f in cat_info.tablefields}

    # Check if new fields already exist
    for field in new_fields:
        if field.name in existing_field_names:
            raise HTTPException(
                status_code=400,
                detail=f"Field '{field.name}' already exists in category '{category}'"
            )

    # Add new fields to the main category table
    added_fields = []
    with engine.connect() as conn:
        for field in new_fields:
            sql_type = sql_type_map.get(field.type)
            if not sql_type:
                raise HTTPException(status_code=400, detail=f"Invalid field type: {field.type}")
            try:
                # Add new column to the category table
                conn.execute(text(
                    f'ALTER TABLE "{category}" ADD COLUMN "{field.name}" {sql_type().__visit_name__.upper()}'
                ))
                added_fields.append(field)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to add field '{field.name}': {str(e)}")

    # Combine existing fields with newly added fields for CategoryInfo metadata
    updated_tablefields = cat_info.tablefields + [f.dict() for f in added_fields]

    # Update CategoryInfo with the new fields (keeping existing ones)
    cat_info.tablefields = updated_tablefields
    db.commit()

    return {
        "message": f"Fields added to category '{category}'",
        "added_fields": [f.name for f in added_fields],
        "updated_fields": updated_tablefields
    }



def delete_field_from_category(category_name: str, field_name: str, db: Session):
    inspector = sqlalchemy.inspect(db.bind)

    if category_name not in inspector.get_table_names():
        raise HTTPException(status_code=404, detail="Category does not exist")

    # Check if the column exists in the actual table
    columns = [col["name"] for col in inspector.get_columns(category_name)]
    if field_name not in columns:
        raise HTTPException(status_code=404, detail="Field does not exist in category")

    # Drop the column, including if it is a primary key
    alter_query = f'ALTER TABLE "{category_name}" DROP COLUMN "{field_name}"'
    try:
        db.execute(text(alter_query))
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete field: {str(e)}")

    # Update JSON metadata in category_info
    category_info = db.query(CategoryInfo).filter_by(tablename=category_name).first()
    if category_info and isinstance(category_info.tablefields, list):
        updated_fields = [
            field for field in category_info.tablefields
            if field.get("name") != field_name
        ]
        category_info.tablefields = updated_fields
        db.commit()

    return {"message": f"Field '{field_name}' deleted successfully from category '{category_name}'"}


def delete_category(data: CategoryDelete, db: Session):
    table = data.category_name.lower().replace(" ", "_")
    try:
        db.execute(text(f'DROP TABLE IF EXISTS "{table}"'))
        db.query(CategoryInfo).filter(CategoryInfo.tablename == table).delete()
        db.commit()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete category: {str(e)}")

    return {"message": f"Category '{table}' deleted successfully"}


def get_categories(db: Session):
    results = db.query(CategoryInfo).all()
    return [
        {
            "table": r.tablename,
            "fields": r.tablefields  # Already a JSON list like [{"name": ..., "type": ...}]
        }
        for r in results
    ]

def print_metadata():
    for table_name, table in metadata.tables.items():
        print(f"Table Name: {table_name}")
        for column in table.columns:
            print(f"  Column: {column.name} ({column.type})")

def add_asset(asset: BaseModel, db: Session):
    try:
        if not asset.table_name or not asset.data:
            raise HTTPException(status_code=400, detail="Table name and data required")

        column_names = []
        placeholders = []
        bind_params = {}

        # Correctly get column types using inspector
        inspector = inspect(db.bind)
        columns = {col["name"]: col["type"] for col in inspector.get_columns(asset.table_name)}

        for i, (col, value) in enumerate(asset.data.items()):
            safe_key = f"param_{i}"
            column_names.append(f'"{col}"')
            placeholders.append(f":{safe_key}")

            col_type = str(columns.get(col, "")).lower()

            if "date" in col_type:
                try:
                    bind_params[safe_key] = datetime.strptime(value, "%Y-%m-%d").date()
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"Invalid date format for '{col}' (expected YYYY-MM-DD)")
            else:
                bind_params[safe_key] = value

        sql = text(f'INSERT INTO "{asset.table_name}" ({", ".join(column_names)}) VALUES ({", ".join(placeholders)})')
        db.execute(sql, bind_params)
        db.commit()

        return {"message": f"Asset added to {asset.table_name}"}

    except Exception as e:
        print("Insert error:", str(e))
        raise HTTPException(status_code=500, detail=f"Insert failed: {str(e)}")


def upload_excel_and_create_tables(file, db: Session):
    try:
        contents = file.file.read()
        xls = pd.ExcelFile(BytesIO(contents))

        for sheet_name in xls.sheet_names:
            df = xls.parse(sheet_name)
            if df.empty:
                continue

            table_name = sheet_name.strip().lower().replace(" ", "_")
            original_columns = list(df.columns)
            normalized_columns = [normalize_column_name(col) for col in original_columns]

            # Detect if asset_tag or asset_code is present
            primary_keys = ["asset_tag", "asset_code"]
            primary_key_found = None
            for col in normalized_columns:
                if col in primary_keys:
                    primary_key_found = col
                    break

            # Define columns with appropriate data types
            columns = []
            for orig_col, norm_col in zip(original_columns, normalized_columns):
                sample_value = df[orig_col].dropna().iloc[0] if not df[orig_col].dropna().empty else ""
                dtype = String  # Default

                if isinstance(sample_value, bool):
                    dtype = Boolean
                elif isinstance(sample_value, int):
                    dtype = Integer
                elif isinstance(sample_value, float):
                    dtype = Float
                elif isinstance(sample_value, pd.Timestamp):
                    dtype = Date

                col_args = {"primary_key": norm_col == primary_key_found}
                columns.append(Column(norm_col, dtype, **col_args))

            # Create the SQLAlchemy table
            new_table = Table(table_name, metadata, *columns, extend_existing=True)
            metadata.create_all(bind=engine, tables=[new_table])

            # Insert or update CategoryInfo
            category_fields = [{"name": n, "type": str(c.type)} for n, c in zip(normalized_columns, columns)]
            existing = db.query(CategoryInfo).filter_by(tablename=table_name).first()
            if existing:
                existing.tablefields = category_fields
            else:
                cat_info = CategoryInfo(tablename=table_name, tablefields=category_fields)
                db.add(cat_info)
            db.commit()

            # Insert data
            insert_data = []
            for _, row in df.iterrows():
                row_dict = {}
                for orig_col, norm_col in zip(original_columns, normalized_columns):
                    value = row[orig_col]
                    row_dict[norm_col] = str(value) if pd.notna(value) else None
                insert_data.append(row_dict)

            if insert_data:
                with engine.begin() as conn:
                    conn.execute(new_table.insert(), insert_data)
                print(f"Inserted {len(insert_data)} rows into table {table_name}")
            else:
                print(f"No data to insert for table {table_name}")

        return {"message": "Excel uploaded successfully, and tables created with data."}

    except Exception as e:
        print(f"Exception during Excel upload: {e}")
        raise HTTPException(status_code=500, detail=f"Error uploading and creating tables: {str(e)}")

def normalize_column_name(name: str) -> str:
    return name.strip().lower().replace(" ", "_")

def search_asset(table_name: str, identifier: str, db: Session):
    try:
        # Get category and fields as JSON
        category = db.query(CategoryInfo).filter_by(tablename=table_name).first()
        if not category:
            raise HTTPException(status_code=404, detail="Table not found")

        fields = category.tablefields  # JSON list like [{"name": "asset tag", "type": "string"}, ...]

        # Identify searchable fields like asset tag or code
        searchable_fields = [
            field["name"]
            for field in fields
            if field["name"].lower().replace(" ", "_") in ["asset_tag", "asset_code"]
        ]

        if not searchable_fields:
            raise HTTPException(status_code=400, detail="No searchable field (asset tag/code) found")

        # Try searching with each matching field
        for field in searchable_fields:
            try:
                sql = text(f'SELECT * FROM "{table_name}" WHERE "{field}" = :identifier')
                result = db.execute(sql, {"identifier": identifier}).fetchall()
                if result:
                    return [dict(row._mapping) for row in result]
            except Exception as inner_e:
                print(f"Search error for field '{field}': {inner_e}")
                continue

        raise HTTPException(status_code=404, detail="Asset not found with the given identifier")

    except Exception as e:
        print("Search failed:", str(e))
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

def delete_asset(table_name: str, identifier: str, db: Session):
    try:
        # Get the table and its fields
        category = db.query(CategoryInfo).filter_by(tablename=table_name).first()
        if not category:
            raise HTTPException(status_code=404, detail="Table not found")

        fields = category.tablefields.split(",")
        searchable_fields = [f for f in fields if f.lower() in ["asset tag", "asset_code", "asset code", "asset_tag"]]

        if not searchable_fields:
            raise HTTPException(status_code=400, detail="No searchable field (asset tag/code) found")

        for field in searchable_fields:
            try:
                # Try deleting based on the searchable field
                sql = text(f'DELETE FROM "{table_name}" WHERE "{field}" = :identifier')
                result = db.execute(sql, {"identifier": identifier})
                db.commit()

                if result.rowcount > 0:
                    return {"detail": f"Asset with identifier '{identifier}' deleted successfully"}

            except Exception:
                continue

        raise HTTPException(status_code=404, detail="Asset not found with the given identifier")

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")



def normalize(field: str) -> str:
    return field.replace(" ", "").replace("_", "").lower()

def reassign_asset(table_name: str, identifier: str, data: Dict[str, str], db: Session):
    # Retrieve the category from the database
    category = db.query(CategoryInfo).filter_by(tablename=table_name).first()

    if not category or not category.tablefields:
        raise HTTPException(status_code=400, detail="Invalid field format in category_info.")
    
    # Parse the tablefields (comma-separated string) into a list and clean up
    db_fields = [field.strip() for field in category.tablefields.split(',')]
    
    # Normalize the fields (remove underscores, spaces, lowercase)
    normalized_db_fields = {
        field.lower().replace("_", "").replace(" ", ""): field for field in db_fields
    }

    # Debugging: Print out the fields for logging purposes
    print(f"Database fields (normalized): {normalized_db_fields}")
    print(f"Input data: {data}")
    
    updated_fields = []
    # Loop through the incoming data and match against the normalized field names
    for input_field, value in data.items():
        norm_input = input_field.lower().replace("_", "").replace(" ", "")
        
        # Find the corresponding field in the normalized list
        db_field = normalized_db_fields.get(norm_input)

        if not db_field:
            # If the field doesn't exist, log it or skip
            print(f"Field '{input_field}' is not a valid field in {table_name}.")
            continue  # Skip the field or handle it if needed

        # Perform the update in the database
        stmt = text(f"""
            UPDATE "{table_name}"
            SET "{db_field}" = :value
            WHERE "asset tag" = :identifier OR "asset code" = :identifier
        """)
        
        # Debugging: Log the SQL statement being executed
        print(f"Executing SQL: {stmt} with params: {value}, {identifier}")
        
        db.execute(stmt, {"value": value, "identifier": identifier})
        updated_fields.append(db_field)

    # Commit the changes if any fields were updated
    if updated_fields:
        db.commit()
        print(f"Updated fields: {', '.join(updated_fields)}")
        return {"message": f"Asset reassigned in {table_name} for {identifier}"}
    else:
        raise HTTPException(status_code=400, detail="No valid fields to update.")


def update_category_fields(table_name: str, db: Session):
    category = db.query(CategoryInfo).filter_by(tablename=table_name).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    existing_fields = json.loads(category.tablefields)
    reassign_fields = [
        "username", "userid", "department", "location", "section",
        "dateofreturn", "dateofreassign", "dateofupdate", "remarks"
    ]

    missing_fields = [f for f in reassign_fields if f not in existing_fields]

    if not missing_fields:
        return {"message": "All reassign fields already exist in this category."}

    for field in missing_fields:
        db.execute(text(f'ALTER TABLE "{table_name}" ADD COLUMN "{field}" TEXT'))

    category.tablefields = json.dumps(existing_fields + missing_fields)
    db.commit()

    return {"message": f"Added missing fields to category '{table_name}'", "added": missing_fields}


