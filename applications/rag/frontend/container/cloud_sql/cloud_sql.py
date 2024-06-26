import os

from google.cloud.sql.connector import Connector, IPTypes
import pymysql
import sqlalchemy
from sentence_transformers import SentenceTransformer
import pg8000

db = None

GCP_PROJECT_NAME = os.environ.get("PROJECT_ID")
GCP_CLOUD_SQL_REGION = os.environ.get("cloudsql_instance_region")
GCP_CLOUD_SQL_INSTANCE = os.environ.get("cloudsql_instance")

TABLE_NAME = os.environ.get('TABLE_NAME', '')  # CloudSQL table name
DB_USER = os.environ.get('DB_USER', 'username')
DB_PASS = os.environ.get('DB_PASS', 'password')

INSTANCE_CONNECTION_NAME = f"{GCP_PROJECT_NAME}:{GCP_CLOUD_SQL_REGION}:{GCP_CLOUD_SQL_INSTANCE}"
SENTENCE_TRANSFORMER_MODEL = 'intfloat/multilingual-e5-small' # Transformer to use for converting text chunks to vector embeddings
DB_NAME = "pgvector-database"

transformer = SentenceTransformer(SENTENCE_TRANSFORMER_MODEL)

def init_db() -> sqlalchemy.engine.base.Engine:
  """Initiates connection to database and its structure."""
  global db
  connector = Connector()
  if db is None:
    db = init_connection_pool(connector)


# helper function to return SQLAlchemy connection pool
def init_connection_pool(connector: Connector) -> sqlalchemy.engine.Engine:
  # function used to generate database connection
  def getconn() -> pymysql.connections.Connection:
    conn = connector.connect(
        INSTANCE_CONNECTION_NAME,
        "pg8000",
        user=DB_USER,
        password=DB_PASS,
        db=DB_NAME,
        ip_type=IPTypes.PRIVATE
    )
    return conn

  # create connection pool
  pool = sqlalchemy.create_engine(
      "postgresql+pg8000://",
      creator=getconn,
  )
  return pool

def fetchContext(query_text):
  with db.connect() as conn:
    try:
      results = conn.execute(sqlalchemy.text("SELECT * FROM " + TABLE_NAME)).fetchall()
      print(f"query database results:")
      for row in results:
        print(row)

      # chunkify query & fetch matches
      query_emb = transformer.encode(query_text).tolist()
      query_request = "SELECT id, text, text_embedding, 1 - ('[" + ",".join(map(str, query_emb)) + "]' <=> text_embedding) AS cosine_similarity FROM " + TABLE_NAME + " ORDER BY cosine_similarity DESC LIMIT 5;"
      query_results = conn.execute(sqlalchemy.text(query_request)).fetchall()
      conn.commit()

      if not query_results:
        message = f"Table {TABLE_NAME} returned empty result"
        raise ValueError(message)
      for row in query_results:
        print(row)
    except sqlalchemy.exc.DBAPIError or pg8000.exceptions.DatabaseError as err:
      message = f"Table {TABLE_NAME} does not exist: {err}"
      raise sqlalchemy.exc.DataError(message)
    except sqlalchemy.exc.DatabaseError as err:
      message = f"Database {INSTANCE_CONNECTION_NAME} does not exist: {err}"
      raise sqlalchemy.exc.DataError(message)
    except Exception as err:
      raise Exception(f"General error: {err}")

  return query_results[0][1]

def storeEmbeddings(data):
  with db.connect() as conn:
    try:
      embeddings = transformer.encode(data).tolist()
      embeddings = embeddings.tobytes()
      query_request =  "INSERT INTO documents (text, embedding) VALUES (%s, %s)",
      conn.execute(sqlalchemy.text(query_request),(data, embeddings))
      conn.commit()
      
    except sqlalchemy.exc.DBAPIError or pg8000.exceptions.DatabaseError as err:
      message = f"Table {TABLE_NAME} does not exist: {err}"
      raise sqlalchemy.exc.DataError(message)
    except sqlalchemy.exc.DatabaseError as err:
      message = f"Database {INSTANCE_CONNECTION_NAME} does not exist: {err}"
      raise sqlalchemy.exc.DataError(message)
    except Exception as err:
      raise Exception(f"General error: {err}")