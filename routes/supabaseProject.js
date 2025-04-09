import fetch from "node-fetch";

const createProjectUrl = "https://api.supabase.com/v1/projects";

export async function createSupabaseProject(req, res) {
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
}