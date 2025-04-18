import { createClient } from "@supabase/supabase-js";

export const createUser = async (req, res) => {
  try {
    const { supabaseUrl, supabaseKey, email, password } = req.body;

    if (!supabaseUrl || !supabaseKey || !email || !password) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Create admin client with service_role key
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log(`[SUPABASE USER] 🚀 Attempting to create user for: ${email} - ${new Date().toISOString()}`);
    
    try {
      // Create the user with admin privileges
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        admin: true,
        email_confirm: true, // Auto-confirm the email
      });
      
      if (userError) {
        console.error(`[SUPABASE USER] ❌ Error creating user: ${JSON.stringify(userError)} - ${new Date().toISOString()}`);
        return res.status(500).json({
          success: false,
          error: "Error creating user",
          details: userError
        });
      } 
      
      console.log(`[SUPABASE USER] ✅ User created successfully: ${userData.user.id} - ${new Date().toISOString()}`);
      
      return res.json({
        success: true,
        message: "[SUPABASE USER] ✅ User created successfully",
        user: userData.user
      });
    } catch (err) {
      console.error(`[SUPABASE USER] ❌ Fatal error creating user: ${err.message} - ${new Date().toISOString()}`);
      return res.status(500).json({
        success: false,
        error: "Server error creating user",
        details: err.message
      });
    }
  } catch (error) {
    console.error("[SUPABASE USER] Error creating user:", error);
    return res.status(500).json({
      success: false,
      error: "Server error creating user",
      details: error.message
    });
  }
}