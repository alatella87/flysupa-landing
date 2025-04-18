import express from "express";
import { createSupabaseProject } from "./supabaseProject.js";
import { executeSql } from "./executeSql.js";
import { setupStorage } from "./setupStorage.js";
import { createVercelProject, deployVercelRepo } from "./vercelProject.js";
import { createUser } from "./createUser.js";
import { addSubdomain } from "./addSubdomain.js";

const router = express.Router();

// Test Endpoint
router.get("/v1/projects", (req, res) => {
  res.json({ message: "Projects endpoint is working" });
});

// Supabase Project Deployment
router.post("/create-supabase-project", createSupabaseProject);

// Execute SQL Schema
router.post("/executeSql", executeSql);

// Setup Storage Buckets
router.post("/setup-storage", setupStorage);

// Vercel Deployment
router.post("/create-vercel-project", createVercelProject);
router.post("/deploy-vercel-repo", deployVercelRepo);

// User Management
router.post("/create-user", createUser);

// Vercel Subdomain
router.post("/vercel-add-subdomain", addSubdomain)

export default router;
