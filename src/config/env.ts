import dotenv from "dotenv";

dotenv.config();

interface EnvVariables {
  PORT: number;
  DB_URL: string;
  NODE_ENV: string;
  BCRYPT_SALT_ROUND: number;
  JWT_ACCESS_SECRET: string;
  JWT_ACCESS_EXPIRES: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES: string;
  SUPER_ADMIN_EMAIL: string;
  SUPER_ADMIN_PASSWORD: string;
  EXPRESS_SESSION_SECRET: string;
  CORS_ORIGIN: string;
  CLIENT_URL: string;
  COOKIE_DOMAIN: string;
  DEMO_USER_EMAIL: string;
  DEMO_USER_PASSWORD: string;
  DEMO_AGENT_EMAIL: string;
  DEMO_AGENT_PASSWORD: string;
  DEMO_ADMIN_EMAIL: string;
  DEMO_ADMIN_PASSWORD: string;
}

const loadEnvVariables = (): EnvVariables => {
  const requiredEnvVariables: string[] = [
    "PORT",
    "DB_URL",
    "NODE_ENV",
    "BCRYPT_SALT_ROUND",
    "JWT_ACCESS_SECRET",
    "JWT_ACCESS_EXPIRES",
    "JWT_REFRESH_SECRET",
    "JWT_REFRESH_EXPIRES",
    "SUPER_ADMIN_EMAIL",
    "SUPER_ADMIN_PASSWORD",
    "EXPRESS_SESSION_SECRET",
    "CORS_ORIGIN",
    "CLIENT_URL",
    "COOKIE_DOMAIN",
  ];

  requiredEnvVariables.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing environment variable: ${key}`);
    }
  });

  const port = Number(process.env.PORT);
  if (isNaN(port)) {
    throw new Error(`Invalid environment variable: PORT`);
  }

  const bcryptSaltRound = Number(process.env.BCRYPT_SALT_ROUND);
  if (isNaN(bcryptSaltRound)) {
    throw new Error(`Invalid environment variable: BCRYPT_SALT_ROUND`);
  }

  return {
    PORT: port,
    DB_URL: process.env.DB_URL as string,
    NODE_ENV: process.env.NODE_ENV as "development" | "production",
    BCRYPT_SALT_ROUND: bcryptSaltRound,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
    JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES as string,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
    JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES as string,
    SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL as string,
    SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD as string,
    EXPRESS_SESSION_SECRET: process.env.EXPRESS_SESSION_SECRET as string,
    CORS_ORIGIN: process.env.CORS_ORIGIN as string,
    CLIENT_URL: process.env.CLIENT_URL as string,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN as string,
    DEMO_USER_EMAIL: process.env.DEMO_USER_EMAIL || "demo.user@example.com",
    DEMO_USER_PASSWORD: process.env.DEMO_USER_PASSWORD || "DemoUser123!",
    DEMO_AGENT_EMAIL: process.env.DEMO_AGENT_EMAIL || "demo.agent@example.com",
    DEMO_AGENT_PASSWORD: process.env.DEMO_AGENT_PASSWORD || "DemoAgent123!",
    DEMO_ADMIN_EMAIL: process.env.DEMO_ADMIN_EMAIL || "demo.admin@example.com",
    DEMO_ADMIN_PASSWORD: process.env.DEMO_ADMIN_PASSWORD || "DemoAdmin123!",
  };
};

export const envVars = loadEnvVariables();
