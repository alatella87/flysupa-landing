import fetch from "node-fetch";

export async function addSubdomain(req, res) {
  try {
    const { schoolName, projectId } = req.body;
    if (!schoolName) throw new Error("School name is missing from request body");

    const options = {
      method: "POST",
      headers: {
        Authorization: `Bearer mvIj6EnxXpfiVUQ89oMmZ2lr`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: `www.${schoolName}.fahrschule-crm.ch` }),
    };
    const response = await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains`, options);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error.message);

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
