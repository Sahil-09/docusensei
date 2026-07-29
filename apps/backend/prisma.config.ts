console.log("ℹ️ Prisma Config Loading...");
console.log("ℹ️ DATABASE_URL in environment:", process.env.DATABASE_URL ? "RESOLVED (starts with " + process.env.DATABASE_URL.substring(0, 10) + ")" : "NOT RESOLVED (undefined)");
console.log(process.env['DATABASE_URL']);
export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: encodeURI(process.env["DATABASE_URL"]),
  },
};
