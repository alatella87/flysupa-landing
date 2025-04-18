import React, { useState, useEffect } from "react";

const Landing: React.FC = () => {
  const [output, setOutput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [formData, setFormData] = useState({
    email: "",
    schoolName: "",
    password: "",
  });
  const [subdomainReady, setSubdomainReady] = useState(false);
  const [dots, setDots] = useState(0);
  
  // Animate dots when progress is at 90%
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (progress === 90 && loading) {
      interval = setInterval(() => {
        setDots(prev => (prev + 1) % 4);
      }, 500);
    } else {
      setDots(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [progress, loading]);

  const API = {
    createSupabase: async (
      apiKey: string,
      projectName: string,
      organization_id: string,
      region: string,
      db_pass: string
    ) => {
      try {
        const res = await fetch(
          "http://localhost:5174/create-supabase-project",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              apiKey,
              projectName,
              organization_id,
              region,
              db_pass,
            }),
          }
        );
        if (!res.ok) throw await res.json();
        return res.json();
      } catch (error) {
        console.error("Error creating Supabase project:", error);
        return null;
      }
    },

    executeSql: async (projectId: string, db_pass: string) => {
      try {
        const res = await fetch("http://localhost:5174/executeSql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, db_pass }),
        });
        return res.ok;
      } catch (error) {
        console.error("SQL Execution Error:", error);
        return false;
      }
    },

    createSupabaseUser: async (supabaseUrl: string, serviceRoleKey: string) => {
      try {
        const res = await fetch("http://localhost:5174/create-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supabaseUrl,
            supabaseKey: serviceRoleKey,
            email: formData.email,
            password: formData.password,
          }),
        });
        if (!res.ok) throw await res.json();
        return res.json();
      } catch (error) {
        console.error("User creation error:", error);
        return null;
      }
    },

    createVercel: async (schoolName: string) => {
      try {
        const res = await fetch("http://localhost:5174/create-vercel-project", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schoolName }),
        });
        if (!res.ok) throw await res.json();
        const result = await res.json();
        setOutput(
          (prev) =>
            prev +
            "\nVercel project created: " +
            JSON.stringify(result, null, 2).substring(0, 300) +
            (JSON.stringify(result).length > 300 ? "..." : "")
        );
        return result;
      } catch (error) {
        setOutput(
          (prev) =>
            prev +
            "\nError creating Vercel project: " +
            JSON.stringify(error, null, 2).substring(0, 300) +
            (JSON.stringify(error).length > 300 ? "..." : "")
        );
        return null;
      }
    },

    setEnvVars: async (
      projectId: string,
      supabaseUrl: string,
      anonKey: string
    ) => {
      try {
        const res = await fetch(
          `https://api.vercel.com/v10/projects/${projectId}/env`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer mvIj6EnxXpfiVUQ89oMmZ2lr`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify([
              {
                key: "VITE_SUPABASE_URL",
                value: supabaseUrl,
                type: "plain",
                target: ["production"],
              },
              {
                key: "VITE_SUPABASE_ANON_KEY",
                value: anonKey,
                type: "plain",
                target: ["production"],
              },
            ]),
          }
        );
        return res.ok;
      } catch (error) {
        console.error("Error setting env vars:", error);
        return false;
      }
    },

    deployVercel: async (projectId: string, schoolName: string) => {
      try {
        const res = await fetch("http://localhost:5174/deploy-vercel-repo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, schoolName }),
        });
        if (!res.ok) throw await res.json();
        const result = await res.json();
        setOutput(
          (prev) =>
            prev +
            "\nDeployment started: " +
            JSON.stringify(result, null, 2).substring(0, 300) +
            (JSON.stringify(result).length > 300 ? "..." : "")
        );
        return true;
      } catch (error) {
        setOutput(
          (prev) =>
            prev +
            "\nDeployment error: " +
            JSON.stringify(error, null, 2).substring(0, 300) +
            (JSON.stringify(error).length > 300 ? "..." : "")
        );
        return false;
      }
    },

    addSubDomain: async (projectId: string, schoolName: string) => {
      try {
        const res = await fetch("http://localhost:5174/vercel-add-subdomain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, schoolName }),
        });
        if (!res.ok) throw await res.json();
        const result = await res.json();
        setOutput(
          (prev) =>
            prev +
            "\nDeployment started: " +
            JSON.stringify(result, null, 2).substring(0, 300) +
            (JSON.stringify(result).length > 300 ? "..." : "")
        );
        setSubdomainReady(true);
        return true;
      } catch (error) {
        setOutput(
          (prev) =>
            prev +
            "\nDeployment error: " +
            JSON.stringify(error, null, 2).substring(0, 300) +
            (JSON.stringify(error).length > 300 ? "..." : "")
        );
        return false;
      }
    },
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "schoolName") {
      // Only allow letters and hyphens, no numbers
      const sanitizedValue = value.toLowerCase().replace(/[^a-z-]/g, "");
      setFormData((prev) => ({
        ...prev,
        [name]: sanitizedValue.substring(0, 12),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProgress(0);

    const apiKey = "sbp_56ed72298488efd3471c5c27e3133539cd4e98e0";
    const organization_id = "ajnfgbpatgqromqqitoz";
    const region = "eu-central-1";
    const db_pass = "test30sada090";

    const schoolName = formData.schoolName;

    let vercelProjectData = null;
    let setEnvVariables = false;

    try {
      // Step 1: Create Supabase project
      const projectData = await API.createSupabase(
        apiKey,
        schoolName,
        organization_id,
        region,
        db_pass
      );
      if (!projectData) return;
      setProgress(14); // ~1/7 complete

      const supabaseProjectId = projectData.id;
      const supabaseUrl = `https://${supabaseProjectId}.supabase.co`;

      // Step 2: Get API keys
      const apiKeyRes = await fetch(
        "http://localhost:5174/get-supabase-api-keys",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, projectId: supabaseProjectId }),
        }
      );

      if (!apiKeyRes.ok) return console.error("Failed to get API keys");
      const apiKeys = await apiKeyRes.json();
      const anonKey = apiKeys.find((k: any) => k.name === "anon")?.api_key;
      const serviceRoleKey = apiKeys.find(
        (k: any) => k.name === "service_role"
      )?.api_key;
      if (!anonKey || !serviceRoleKey) return console.error("Missing keys");
      setProgress(28); // ~2/7 complete

      // Step 3: Execute schema
      const schemaResult = await API.executeSql(supabaseProjectId, db_pass);
      if (!schemaResult) return;
      setProgress(42); // ~3/7 complete

      // Step 4: Set up storage
      const storageRes = await fetch("http://localhost:5174/setup-storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supabaseUrl,
          supabaseKey: anonKey,
          db_pass,
          projectId: supabaseProjectId,
        }),
      });

      if (!storageRes.ok) return;
      setProgress(56); // ~4/7 complete

      // Step 5: Create user
      await API.createSupabaseUser(supabaseUrl, serviceRoleKey);
      setProgress(70); // ~5/7 complete

      // Step 6: Vercel project
      vercelProjectData = await API.createVercel(schoolName);
      setProgress(84); // ~6/7 complete

      // Step 7: Set env vars + deploy + add sub domain
      if (vercelProjectData?.id) {
        setEnvVariables = await API.setEnvVars(
          vercelProjectData.id,
          supabaseUrl,
          anonKey
        );
        if (setEnvVariables) {
          await API.deployVercel(vercelProjectData.id, schoolName);
          await API.addSubDomain(vercelProjectData.id, schoolName);

          // Add 15 seconds extra timeout after subdomain creation
          setProgress(90); // Show progress at 95% during the timeout
          await new Promise((resolve) => setTimeout(resolve, 25000));
          setProgress(100); // 7/7 complete
        }
      }
    } catch (err) {
      console.error("Unhandled error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-md mx-auto mt-10 p-6 rounded shadow-lg bg-[#292524] text-white">
        <h1 className="text-2xl font-bold mb-6 text-white">
          Create School Project
        </h1>
        <form onSubmit={handleClick}>
          <div className="mb-4">
            <label className="block mb-1 text-white">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full p-2 border rounded bg-transparent text-white border-gray-600"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-white">
              School Name
            </label>
            <input
              type="text"
              name="schoolName"
              value={formData.schoolName}
              onChange={handleInputChange}
              className="w-full p-2 border bg-transparent rounded text-white border-gray-600"
              pattern="[a-zA-Z-]{1,12}"
              maxLength={12}
              required
            />
            <p className="text-xs text-gray-400 mt-1">(letters only, max 12 characters, no numbers)</p>
          </div>

          <div className="mb-6">
            <label className="block mb-1 text-white">Password</label>
            <input
              autoComplete="true"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full p-2 border rounded bg-transparent text-white border-gray-600"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full relative text-gray-500 py-2 px-4 rounded overflow-hidden"
            disabled={loading || !formData.email || !formData.schoolName || !formData.password}
            style={{ 
              backgroundColor: loading ? "#4ade8052" : "#4ade80",
              opacity: (!formData.email || !formData.schoolName || !formData.password) ? 0.6 : 1
            }}>
            {loading && (
              <div
                className="absolute top-0 left-0 h-full bg-[#4ade80] transition-all duration-300 ease-out z-0"
                style={{ width: `${progress}%` }}
              />
            )}
            <span className="relative z-10 text-black">
              {loading ? `Creating... ${progress}%` : "Create Project"}
            </span>
            
          </button>
          {progress === 90 && loading && (
            <div className="text-xs mt-2 text-white">
              Assigning domain, this might take a while{'.'.repeat(dots)}
            </div>
          )}
        </form>

        {formData.schoolName && (
          <div className="mt-1 text-sm">
            {subdomainReady ? (
              <a
                href={`https://${formData.schoolName}.fahrschule-crm.ch`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:underline font-bold"
                style={{ color: "#4ade80" }}>
                https://{formData.schoolName}.fahrschule-crm.ch
              </a>
            ) : (
              <span className="text-white">
                https://{formData.schoolName}.fahrschule-crm.ch
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Landing;
