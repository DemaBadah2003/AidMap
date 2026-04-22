import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrations: {
    seed: "node ./prisma/seed.js",
    path: "./prisma/migrations",
  },
  datasource: {
    // ضع هنا رابط الـ postgres المباشر (Direct URL) الذي نسخته من الصورة السابقة
    url: "postgres://15ec666422f4899115f3e2e3177f7315712b80f92e9a800a4a5ae8c9cd40250d:sk_KrEZX-vwls0xafz-dwcjq@db.prisma.io:5432/postgres?sslmode=require",
  },
});