import pg from "pg";
import fs from "fs";

const { Pool } = pg;

export async function executeSql(req, res) {
  try {
    const { projectId, db_pass } = req.body;
    if (!projectId) throw new Error("Project ID is missing from request body");
    if (!db_pass) throw new Error("Database password is missing from request body");

    console.log(`[SUPABASE DB] 🔌 Connecting to database for project ${projectId}`);
    
    const pool = new Pool({
      connectionString: `postgresql://postgres:${db_pass}@db.${projectId}.supabase.co:5432/postgres`,
      ssl: { rejectUnauthorized: false },
    });

    console.log("[SUPABASE DB] 📜 Reading and executing SQL schema");
    const sql = fs.readFileSync("./dry_schema.sql", "utf8");
    await pool.query("SET search_path TO public;");
    await pool.query(sql);
    
    // Call the function to set up storage policies
    console.log("[SUPABASE DB] 🔒 Setting up storage policies");
    await pool.query("SELECT setup_storage_policies()");
    
    await pool.end();

    res.json({ message: "[SUPABASE DB] ✅ ✅ Schema applied successfully" });
  } catch (error) {
    console.error("Error in executeSql endpoint:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
}