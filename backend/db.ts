import sql from 'mssql';
import 'dotenv/config';

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
  }
};

let pool: sql.ConnectionPool;

export const connectDB = async () => {
  try {
    if (pool && pool.connected) {
      return pool;
    }
    pool = await new sql.ConnectionPool(dbConfig).connect();
    console.log('Connected to MSSQL');
    return pool;
  } catch (err) {
    console.error('Database Connection Failed', err);
    throw err;
  }
};

export const getPool = () => {
  if (!pool || !pool.connected) {
    throw new Error("Database not connected. Call connectDB first.");
  }
  return pool;
}

export { sql };
