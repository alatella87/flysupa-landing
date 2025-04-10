import { createClient } from "@supabase/supabase-js";

export async function setupStorage(supabaseUrl, supabaseKey) {
  // Create a new client with admin key (service_role key)
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    console.log(`[SUPABASE STORAGE] 🚀 Attempting to create 'avatars' bucket - ${new Date().toISOString()}`);
    // Create avatars bucket
    const { error: avatarError, data: avatarData } = await supabase.storage.createBucket('avatars', {
      public: false,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
      fileSizeLimit: 1024 * 1024, // 1MB
    });
    
    if (avatarError) {
      if (avatarError.message.includes('already exists')) {
        console.log(`[SUPABASE STORAGE] ⚠️ Avatars bucket already exists - ${new Date().toISOString()}`);
      } else {
        console.error(`[SUPABASE STORAGE] ❌ Error creating avatars bucket: ${JSON.stringify(avatarError)} - ${new Date().toISOString()}`);
        throw avatarError;
      }
    } else {
      console.log(`[SUPABASE STORAGE] ✅ Created avatars bucket successfully - ${new Date().toISOString()}`);
    }
    
    console.log(`[SUPABASE STORAGE] 🚀 Attempting to create 'licenses' bucket - ${new Date().toISOString()}`);
    // Create licenses bucket
    const { error: licenseError, data: licenseData } = await supabase.storage.createBucket('licenses', {
      public: false,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/pdf'],
      fileSizeLimit: 2 * 1024 * 1024, // 2MB
    });
    
    if (licenseError) {
      if (licenseError.message.includes('already exists')) {
        console.log(`[SUPABASE STORAGE] ⚠️ Licenses bucket already exists - ${new Date().toISOString()}`);
      } else {
        console.error(`[SUPABASE STORAGE] ❌ Error creating licenses bucket: ${JSON.stringify(licenseError)} - ${new Date().toISOString()}`);
        throw licenseError;
      }
    } else {
      console.log(`[SUPABASE STORAGE] ✅ Created licenses bucket successfully - ${new Date().toISOString()}`);
    }
    
    // Now set up RLS policies for the buckets
    // Note: This requires using SQL directly via RPC since the JS client doesn't support policy management

    // Note: Instead of using RPC calls here, we'll let the setup_storage_policies SQL function
    // handle policy creation, as it's more reliable with proper permissions
    console.log('[SUPABASE STORAGE] ℹ️ Skipping client-side policy creation - will be handled by SQL function');
    
    return { success: true };
  } catch (error) {
    console.error('Error setting up storage:', error);
    return { success: false, error };
  }
}