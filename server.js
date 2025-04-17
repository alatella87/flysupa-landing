import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { type } from "node:os";
import router from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;
const app = express();
const port = 5174;
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

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Logging Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Use router for API endpoints
app.use(router);

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

    const projectData = await response.json();
    console.log("[SUPABASE] ✅ Project created successfully", projectData);
    res.json(projectData);
  } catch (error) {
    res.status(500).json({
      error: "Error making request to Supabase",
      details: error.message,
    });
  }
});

// ================================================================
// ?=================   GET SUPABASE API KEYS
// ================================================================

app.post("/get-supabase-api-keys", async (req, res) => {
  try {
    const { apiKey, projectId } = req.body;
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectId}/api-keys`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return res
        .status(500)
        .json({ error: "Error fetching API keys", details: error });
    }

    const apiKeysData = await response.json();
    console.log("[SUPABASE] ✅ API keys fetched successfully");
    res.json(apiKeysData);
  } catch (error) {
    res.status(500).json({
      error: "Error making request to Supabase API",
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
    await pool.query("SET search_path TO public;");
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

    // Create admin client with proper configuration
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log("[SUPABASE STORAGE] 🚀 Creating storage buckets with admin privileges");
    
    // Create avatars bucket
    console.log(`[SUPABASE STORAGE] 🚀 Attempting to create 'avatars' bucket - ${new Date().toISOString()}`);
    try {
      const { data: avatarData, error: avatarError } = await supabase.storage.createBucket("avatars", {
        public: false,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
        fileSizeLimit: 1024 * 1024, // 1MB
      });
      
      if (avatarError) {
        if (avatarError.message?.includes("already exists")) {
          console.log(`[SUPABASE STORAGE] ⚠️ Avatars bucket already exists - ${new Date().toISOString()}`);
        } else {
          console.error(`[SUPABASE STORAGE] ❌ Error creating avatars bucket: ${JSON.stringify(avatarError)} - ${new Date().toISOString()}`);
          throw avatarError;
        }
      } else {
        console.log(`[SUPABASE STORAGE] ✅ Avatars bucket created successfully - ${new Date().toISOString()}`);
      }
    } catch (err) {
      console.error(`[SUPABASE STORAGE] ❌ Fatal error creating avatars bucket: ${err.message} - ${new Date().toISOString()}`);
    }

    // Create licenses bucket
    console.log(`[SUPABASE STORAGE] 🚀 Attempting to create 'licenses' bucket - ${new Date().toISOString()}`);
    try {
      const { data: licenseData, error: licenseError } = await supabase.storage.createBucket("licenses", {
        public: false,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/pdf'],
        fileSizeLimit: 2 * 1024 * 1024, // 2MB
      });
      
      if (licenseError) {
        if (licenseError.message?.includes("already exists")) {
          console.log(`[SUPABASE STORAGE] ⚠️ Licenses bucket already exists - ${new Date().toISOString()}`);
        } else {
          console.error(`[SUPABASE STORAGE] ❌ Error creating licenses bucket: ${JSON.stringify(licenseError)} - ${new Date().toISOString()}`);
          throw licenseError;
        }
      } else {
        console.log(`[SUPABASE STORAGE] ✅ Licenses bucket created successfully - ${new Date().toISOString()}`);
      }
    } catch (err) {
      console.error(`[SUPABASE STORAGE] ❌ Fatal error creating licenses bucket: ${err.message} - ${new Date().toISOString()}`);
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
        await pool.query("SET search_path TO public;");
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
      // ToDo: move the bearer somewhere else
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
          ref: "master",
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
        name: schoolName,
        target: "production",
        gitMetadata: {
          remoteUrl: "https://github.com/alatella87/flysupa",
        },
        gitSource: {
          org: 'alatella87',
          ref: 'master',
          repo: 'flysupa',
          type: 'github',
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


// Catch-all handler for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
