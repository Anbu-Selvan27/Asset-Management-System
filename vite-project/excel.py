import pandas as pd
from fastapi import UploadFile
from pytest import Session
from sqlalchemy import Engine, Table, Column, String, MetaData, text
from fastapi import HTTPException

from models import Base, CategoryInfo

metadata = Base.metadata

def create_tables_from_excel(file: UploadFile, db: Session):
    try:
        # Read all sheets
        excel_data = pd.read_excel(file.file, sheet_name=None)

        created_tables = []

        for sheet_name, df in excel_data.items():
            if df.empty:
                continue  # skip empty sheets

            table_name = sheet_name.strip().lower().replace(" ", "_")
            fields = [str(col).strip().lower().replace(" ", "_") for col in df.columns]

            # Define columns (first column as primary key)
            columns = [Column(fields[0], String, primary_key=True)]
            for field in fields[1:]:
                columns.append(Column(field, String))

            # Dynamically create the table
            new_table = Table(table_name, metadata, *columns)
            new_table.create(bind=Engine)

            # Insert rows
            for _, row in df.iterrows():
                insert_data = {f: str(row[f]) if not pd.isna(row[f]) else "" for f in fields}
                sql = text(
                    f'INSERT INTO "{table_name}" ({", ".join(fields)}) VALUES ({", ".join([f":{f}" for f in fields])})'
                )
                db.execute(sql, insert_data)

            # Save metadata
            cat_info = CategoryInfo(tablename=table_name, tablefields=",".join(fields))
            db.add(cat_info)

            created_tables.append(table_name)

        db.commit()
        return {"message": "Tables created successfully", "tables": created_tables}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing Excel file: {str(e)}")
    