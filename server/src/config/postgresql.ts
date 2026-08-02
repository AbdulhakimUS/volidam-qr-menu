import { Pool } from "pg";
import { ENV } from "./env.js";

const requiredEnvVars = [
  "POSTGRES_HOST",
  "POSTGRES_PORT",
  "POSTGRES_DATABASE",
  "POSTGRES_USER",
  "POSTGRES_PASSWORD",
];

const missingEnvVars = requiredEnvVars.filter(
  (key) => !ENV[key as keyof typeof ENV],
);

if (missingEnvVars.length > 0) {
  console.error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`,
  );
  process.exit(1);
}

const pool = new Pool({
  host: ENV.POSTGRES_HOST,
  port: Number(ENV.POSTGRES_PORT) || 5432,
  database: ENV.POSTGRES_DATABASE,
  user: ENV.POSTGRES_USER,
  password: ENV.POSTGRES_PASSWORD,
});

export default pool;
