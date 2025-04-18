import fetch from "node-fetch";
import { type } from "node:os";

export async function createVercelProject(req, res) {
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
}

export async function deployVercelRepo(req, res) {
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
        gitSource: {
          org: 'alatella87',
          ref: 'main',
          repo: 'flysupa',
          type: 'github'
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
}