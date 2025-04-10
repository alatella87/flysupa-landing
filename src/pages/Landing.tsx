import React, { useState } from "react";

const Landing: React.FC = () => {
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    email: "",
    schoolName: "",
    fullName: "",
    password: "",
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
        "http://localhost:5174/create-supabase-project",
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
      const response = await fetch("http://localhost:5174/executeSql", {
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

  const createUser = async (supabaseUrl: string, serviceRoleKey: string) => {
    try {
      const response = await fetch("http://localhost:5174/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supabaseUrl,
          supabaseKey: serviceRoleKey,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          admin: true,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error("Error creating user:", error);
        return null;
      }
      
      const userData = await response.json();
      console.log("✅ User created successfully:", userData);
      return userData;
    } catch (error) {
      console.error("Error creating user:", error);
      return null;
    }
  };

  const createVercel = async (schoolName: string) => {
    try {
      const response = await fetch(
        "http://localhost:5174/create-vercel-project",
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
      const response = await fetch("http://localhost:5174/deploy-vercel-repo", {
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
    const newValue = name === "schoolName" ? value.toLowerCase() : value;
    setFormData((prevData) => ({
      ...prevData,
      [name]: newValue,
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
        console.log('response', projectData)
        const apiKeysResponse = await fetch(
          "http://localhost:5174/get-supabase-api-keys",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              apiKey,
              projectId: supabaseProjectId
            }),
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
        const schemaResult = await executeSql(supabaseProjectId, db_pass);

        // Step 4: Set up storage buckets and policies
        const supabaseUrl = `https://${supabaseProjectId}.supabase.co`;

        // Set up storage buckets
        const storageResponse = await fetch("http://localhost:5174/setup-storage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            supabaseUrl,
            supabaseKey: anonKey,
            db_pass,
            projectId: supabaseProjectId,
          }),
        });
        
        if (storageResponse.ok) {
          // Step 5: Create the first user
          // Get service role key for admin operations
          const serviceRoleKey = apiKeysData.find(
            (key: { name: string }) => key.name === "service_role"
          )?.api_key;
          
          if (serviceRoleKey) {
            const userData = await createUser(supabaseUrl, serviceRoleKey);
            console.log("User creation result:", userData);
          } else {
            console.error("Service role key not found, cannot create user");
          }
        }

        // Step 6: Create Vercel project after schema execution
        if (schemaResult) {
          const vercelProjectData = await createVercel(formData.schoolName);

          // Step 7: Deploy Vercel project if it was created successfully
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

        <div className="mb-4">
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

        <div className="mb-6">
          <label className="block text-gray-700 mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
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
