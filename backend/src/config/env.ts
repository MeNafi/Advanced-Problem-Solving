import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 5000),
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
