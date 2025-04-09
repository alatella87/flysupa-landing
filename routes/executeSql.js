import pg from "pg";
import fs from "fs";

const { Pool } = pg;

export async function executeSql(req, res) {
  try {
    const { projectId, db_pass } = req.body;
    if (!projectId) throw new Error("Project ID is missing from request body");

    // *
    const pool = new Pool({
      connectionString: `postgresql://postgres:${db_pass}@db.${projectId}.supabase.co:5432/postgres`,
      ssl: { rejectUnauthorized: false },
    });

    const sql = fs.readFileSync("./dry_schema.sql", "utf8");
    await pool.query(sql);
    await pool.end();

    res.json({ message: "[SUPABASE DB] ✅ ✅ Schema applied successfully" });
  } catch (error) {
    console.error("Error in executeSql endpoint:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
}