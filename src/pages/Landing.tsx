import React, { useState } from "react";
import { setupStorage } from "../services/setupStorage";

const Landing: React.FC = () => {
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    email: "",
    schoolName: "",
    fullName: "",
  });

  const createSupabase = async (
    apiKey: string,
    projectName: string,
    organization_id: string,
    region: string,
    db_pass: string
  ) => {
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3000/create-supabase-project",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiKey,
            projectName,
            organization_id,
            region,
            db_pass,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.log("Error creating project: " + JSON.stringify(error));
        return null;
      }

      const projectData = await response.json();
      console.log("✅ ✅ Project created: " + JSON.stringify(projectData));
      return projectData;
    } catch (error) {
      console.log("Error: " + error);
      return null;
    }
  };

  const executeSql = async (projectId: string, db_pass: string) => {
    try {
      const response = await fetch("http://localhost:3000/executeSql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          db_pass,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return false;
      }

      const result = await response.json();
      return true;
    } catch (error) {
      return false;
    }
  };

  const createVercel = async (schoolName: string) => {
    try {
      const response = await fetch(
        "http://localhost:3000/create-vercel-project",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            schoolName,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        setOutput(
          (prevOutput) =>
            prevOutput +
            "Error creating Vercel project: " +
            JSON.stringify(error)
        );
        return null;
      }

      const result = await response.json();
      setOutput(
        (prevOutput) =>
          prevOutput +
          "Vercel project created successfully: " +
          JSON.stringify(result)
      );
      return result;
    } catch (error) {
      setOutput(
        (prevOutput) => prevOutput + "Error creating Vercel project: " + error
      );
      return null;
    }
  };

  const deployVercel = async (projectId: string, schoolName: string) => {
    try {
      const response = await fetch("http://localhost:3000/deploy-vercel-repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          schoolName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setOutput(
          (prevOutput) =>
            prevOutput +
            "Error deploying Vercel project: " +
            JSON.stringify(error)
        );
        return false;
      }

      const result = await response.json();
      setOutput(
        (prevOutput) =>
          prevOutput +
          "Vercel deployment initiated successfully: " +
          JSON.stringify(result)
      );
      return true;
    } catch (error) {
      setOutput(
        (prevOutput) => prevOutput + "Error deploying Vercel project: " + error
      );
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // ================================================================
    // ?=================   Management API
    // ================================================================

    const apiKey = "sbp_56ed72298488efd3471c5c27e3133539cd4e98e0";
    const organization_id = "ajnfgbpatgqromqqitoz";
    const region = "eu-central-1";
    const db_pass = "test30sada090";
    const schoolName = formData.schoolName;

    try {
      // Step 1: Create the Supabase project
      const projectData = await createSupabase(
        apiKey,
        schoolName,
        organization_id,
        region,
        db_pass
      );

      if (projectData) {
        // Step 2: Get API keys from the --> new project
        const supabaseProjectId = projectData.id;
        const apiKeysResponse = await fetch(
          `https://api.supabase.com/v1/projects/${supabaseProjectId}/api-keys`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!apiKeysResponse.ok) {
          console.error(
            "Error fetching API keys:",
            await apiKeysResponse.json()
          );
          return;
        }

        const apiKeysData = await apiKeysResponse.json();
        const anonKey = apiKeysData.find(
          (key: { name: string }) => key.name === "anon"
        )?.api_key;

        if (!anonKey) {
          console.error("Anon API key not found");
          return;
        }

        // Step 3: Execute the SQL schema on the new project
        const schemaResult = await executeSql(
          supabaseProjectId,
          db_pass
        );

        // Step 4: Set up storage buckets and policies
        const supabaseUrl = `https://${supabaseProjectId}.supabase.co`;
        
        // Set up storage buckets
        await fetch("http://localhost:3000/setup-storage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            supabaseUrl,
            supabaseKey: anonKey,
            db_pass,
            projectId: supabaseProjectId
          }),
        });

        // Step 5: Create Vercel project after schema execution
        if (schemaResult) {
          const vercelProjectData = await createVercel(formData.schoolName);

          // Step 6: Deploy Vercel project if it was created successfully
          if (vercelProjectData && vercelProjectData.id) {
            await deployVercel(vercelProjectData.id, schoolName);
          }
        }
      }
    } catch (error) {
      console.log("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 rounded shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Create School Project</h1>

      <form onSubmit={handleClick}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-transparent"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-1">School Name</label>
          <input
            type="text"
            name="schoolName"
            value={formData.schoolName}
            onChange={handleInputChange}
            className="w-full p-2 border bg-transparent rounded"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            className="w-full p-2 border rounded bg-transparent"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          disabled={loading}>
          {loading ? "Creating..." : "Create Project"}
        </button>
      </form>

      {output && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Output:</h2>
          <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-60 text-sm">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
};

export default Landing;
