import pg from "pg";
import { setupStorage as setupStorageBuckets } from "../src/services/setupStorage.js";

const { Pool } = pg;

export async function setupStorage(req, res) {
  try {
    const { supabaseUrl, supabaseKey, db_pass, projectId } = req.body;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    console.log("[SUPABASE STORAGE] 🚀 Starting storage setup process");
    
    // Use the existing utility function to set up storage buckets
    // Make sure supabaseKey is the service_role key, not anon key
    const storageResult = await setupStorageBuckets(supabaseUrl, supabaseKey);
    
    if (!storageResult.success) {
      return res.status(500).json({
        success: false,
        error: "Error setting up storage buckets",
        details: storageResult.error
      });
    }

    // Set up storage policies using the database connection if projectId and db_pass provided
    if (projectId && db_pass) {
      try {
        const pool = new Pool({
          connectionString: `postgresql://postgres:${db_pass}@db.${projectId}.supabase.co:5432/postgres`,
          ssl: { rejectUnauthorized: false },
        });

        // Call the function we created in dry_schema.sql
        await pool.query("SELECT setup_storage_policies()");
        await pool.end();
        console.log("[SUPABASE STORAGE] ✅ 🙌 ✅ Storage policies applied");
      } catch (dbErr) {
        console.error(
          "[SUPABASE STORAGE] Error applying storage policies:",
          dbErr
        );
        return res.status(500).json({
          success: false,
          error: "Error applying storage policies",
          details: dbErr.message,
        });
      }
    }

    return res.json({
      success: true,
      message:
        "[SUPABASE STORAGE] ✅ 🙌 ✅ Storage setup completed successfully",
    });
  } catch (error) {
    console.error("[SUPABASE STORAGE] Error setting up storage:", error);
    return res.status(500).json({
      success: false,
      error: "Server error setting up storage",
      details: error.message,
    });
  }
}