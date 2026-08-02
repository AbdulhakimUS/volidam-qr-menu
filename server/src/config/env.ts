import dotenv from "dotenv";

dotenv.config({ quiet: true });

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Majburiy muhit o'zgaruvchisi topilmadi: ${key}`);
  }

  return value;
}

function optional(key: string, fallback = ""): string {
  return process.env[key] || fallback;
}

export const ENV = {
  PORT: process.env.PORT || "3000",

  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

  POSTGRES_HOST: required("POSTGRES_HOST"),
  POSTGRES_PORT: required("POSTGRES_PORT"),
  POSTGRES_DATABASE: required("POSTGRES_DATABASE"),
  POSTGRES_USER: required("POSTGRES_USER"),
  POSTGRES_PASSWORD: required("POSTGRES_PASSWORD"),

  NODE_ENV: process.env.NODE_ENV || "development",

  ADMIN_USERNAME: required("ADMIN_USERNAME"),
  ADMIN_PASSWORD: required("ADMIN_PASSWORD"),

  JWT_ACCESS_SECRET: required("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET"),

  CLOUDINARY_CLOUD_NAME: optional("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY: optional("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: optional("CLOUDINARY_API_SECRET"),
};
