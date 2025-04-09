import { createClient } from "@supabase/supabase-js";

export async function setupStorage(supabaseUrl: string, supabaseKey: string) {
  // Create a new client with admin key (service_role key)
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Create avatars bucket
    const { error: avatarError } = await supabase.storage.createBucket('avatars', {
      public: false,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
      fileSizeLimit: 1024 * 1024, // 1MB
    });
    
    if (avatarError) {
      if (avatarError.message.includes('already exists')) {
        console.log('Avatars bucket already exists');
      } else {
        throw avatarError;
      }
    } else {
      console.log('Created avatars bucket successfully');
    }
    
    // Create licenses bucket
    const { error: licenseError } = await supabase.storage.createBucket('licenses', {
      public: false,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/pdf'],
      fileSizeLimit: 2 * 1024 * 1024, // 2MB
    });
    
    if (licenseError) {
      if (licenseError.message.includes('already exists')) {
        console.log('Licenses bucket already exists');
      } else {
        throw licenseError;
      }
    } else {
      console.log('Created licenses bucket successfully');
    }
    
    // Now set up RLS policies for the buckets
    // Note: This requires using SQL directly via RPC since the JS client doesn't support policy management

    // Set up policy for avatars bucket - users can upload their own avatars
    const { error: avatarPolicyError } = await supabase.rpc('apply_storage_policy', {
      bucket_name: 'avatars',
      policy_name: 'User can upload their own avatar',
      definition: `(bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid)`,
      operation: 'INSERT'
    });

    if (avatarPolicyError) console.error('Error setting up avatar policy:', avatarPolicyError);
    else console.log('Avatar policy created successfully');
    
    // Set up policy for licenses bucket - users can upload their own licenses
    const { error: licensePolicyError } = await supabase.rpc('apply_storage_policy', {
      bucket_name: 'licenses',
      policy_name: 'User can upload their own license',
      definition: `(bucket_id = 'licenses' AND auth.uid() = (storage.foldername(name))[1]::uuid)`,
      operation: 'INSERT'
    });

    if (licensePolicyError) console.error('Error setting up license policy:', licensePolicyError);
    else console.log('License policy created successfully');
    
    return { success: true };
  } catch (error) {
    console.error('Error setting up storage:', error);
    return { success: false, error };
  }
}