import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import pg from "pg";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const { Pool } = pg;
const app = express();
const port = 3000;
const createProjectUrl = "https://api.supabase.com/v1/projects";

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Logging Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ================================================================
// ?=================   SUPABASE (PROJECT) DEPLOYMENT
// ================================================================

app.post("/create-supabase-project", async (req, res) => {
  try {
    const { apiKey, projectName, organization_id, region, db_pass } = req.body;
    const response = await fetch(createProjectUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectName,
        db_pass,
        organization_id,
        region,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res
        .status(500)
        .json({ error: "Error creating project", details: error });
    }

    res.json(await response.json());
    console.log(
      "[SUPABASE] ✅ Project created successfully",
      await response.json()
    );
  } catch (error) {
    res.status(500).json({
      error: "Error making request to Supabase",
      details: error.message,
    });
  }
});

// ================================================================
// ?=================   SUPABASE (EXECUTE) SCHEMA SQL
// ================================================================

app.post("/executeSql", async (req, res) => {
  try {
    const { projectId, db_pass } = req.body;
    if (!projectId) throw new Error("Project ID is missing from request body");

    //? Connect to the Supabase database
    const pool = new Pool({
      connectionString: `postgresql://postgres:${db_pass}@db.${projectId}.supabase.co:5432/postgres`,
      ssl: { rejectUnauthorized: false },
    });
    //? Read the SQL file
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
});

// ================================================================
// ?=================   SETUP STORAGE (AVATARS, LICENCES)
// ================================================================

app.post("/setup-storage", async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey, db_pass, projectId } = req.body;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create avatars bucket
    try {
      await supabase.storage.createBucket("avatars", {
        public: false,
        fileSizeLimit: 2 * 1024 * 1024, // 2MB
      });
      console.log("[SUPABASE STORAGE] ✅ ✅ ✅ Avatars bucket created");
    } catch (err) {
      // Ignore "already exists" errors
      if (!err.message?.includes("already exists")) {
        console.error("[SUPABASE STORAGE] Error creating avatars bucket:", err);
      }
    }

    // Create licenses bucket
    try {
      await supabase.storage.createBucket("licenses", {
        public: false,
        fileSizeLimit: 2 * 1024 * 1024, // 2MB
      });
      console.log("[SUPABASE STORAGE] ✅ ✅ ✅ Licenses bucket created");
    } catch (err) {
      // Ignore "already exists" errors
      if (!err.message?.includes("already exists")) {
        console.error(
          "[SUPABASE STORAGE] Error creating licenses bucket:",
          err
        );
      }
    }

    // ================================================================
    // ?=================   SETUP STORAGE POLICIES ====================
    // ================================================================

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
});

// ================================================================
// ?=================   VERCEL DEPLOYMENT =========================
// ================================================================

app.post("/create-vercel-project", async (req, res) => {
  try {
    const { schoolName } = req.body;
    if (!schoolName)
      throw new Error("School name is missing from request body");

    const response = await fetch("https://api.vercel.com/v9/projects", {
      method: "POST",
      headers: {
        Authorization: `Bearer mvIj6EnxXpfiVUQ89oMmZ2lr`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: schoolName,
        framework: "vite",
        gitRepository: {
          type: "github",
          repo: `alatella87/flysupa`,
          ref: "dev",
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res
        .status(500)
        .json({ error: "Error creating Vercel project", details: error });
    }

    const projectData = await response.json();
    res.json(projectData);
    console.log("[VERCEL] Vercel project created successfully", projectData);
  } catch (error) {
    console.error("Error in create-vercel-project endpoint:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// ! 4 | Deploy the Vercel project after creation
app.post("/deploy-vercel-repo", async (req, res) => {
  try {
    const { projectId, schoolName } = req.body;
    if (!projectId) throw new Error("Project ID is missing from request body");

    const response = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer mvIj6EnxXpfiVUQ89oMmZ2lr`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        name: schoolName,
        target: "production",
        gitSource: {
          type: "github",
          ref: "main",
          repoId: "alatella87/flysupa",
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res
        .status(500)
        .json({ error: "Error deploying Vercel project", details: error });
    }

    const deploymentData = await response.json();
    res.json(deploymentData);
    console.log(
      "[VERCEL] ✅ Vercel deployment initiated successfully",
      deploymentData
    );
  } catch (error) {
    console.error("Error in deploy-vercel-repo endpoint:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
