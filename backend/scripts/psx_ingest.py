"""Simple PSX ingestion script.
Reads CSV files from `backend/psx_data/` and upserts into `public.psx_stocks`.

Run inside the backend container or locally with environment variables:
  POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
"""
import os
import csv
import glob
import psycopg2
from psycopg2.extras import Json

DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "example")
DB_NAME = os.getenv("POSTGRES_DB", "postgres")


def get_connection():
    return psycopg2.connect(host=DB_HOST, user=DB_USER, password=DB_PASS, dbname=DB_NAME)


def ingest_csv(path: str):
    print(f"Ingesting {path}")
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    conn = get_connection()
    cur = conn.cursor()
    for r in rows:
        symbol = r.get('symbol') or r.get('Symbol')
        name = r.get('name') or r.get('Name')
        last_price = r.get('last_price') or r.get('Last')
        last_date = r.get('last_date') or r.get('Date')
        market_cap = r.get('market_cap')

        cur.execute(
            """
            INSERT INTO public.psx_stocks (symbol, name, last_price, last_date, market_cap, metadata)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (symbol) DO UPDATE SET
              name = EXCLUDED.name,
              last_price = EXCLUDED.last_price,
              last_date = EXCLUDED.last_date,
              market_cap = EXCLUDED.market_cap,
              metadata = EXCLUDED.metadata;
            """,
            (symbol, name, last_price or None, last_date or None, market_cap or None, Json(r)),
        )

    conn.commit()
    cur.close()
    conn.close()


def main():
    csvs = glob.glob('backend/psx_data/*.csv')
    if not csvs:
        print("No CSV files found in backend/psx_data/")
        return
    for c in csvs:
        ingest_csv(c)


if __name__ == '__main__':
    main()
