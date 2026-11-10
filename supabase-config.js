/**
 * SUPABASE CONFIGURATION FILE
 * Yahan aapko apne Supabase Project ka URL aur Anon Key daalna hai.
 * 
 * Steps (2 minute ka setup):
 * 1. https://supabase.com pe free account banaiye aur ek naya project banaiye.
 * 2. Project Dashboard me: Settings (gear icon) > API pe jaiye.
 * 3. Wahan se "Project URL" aur "anon public" key copy karke neeche paste kijiye.
 * 4. Storage me jakar ek Public Bucket banaiye jiska naam "birthday-media" rakhiye.
 * 5. SQL Editor me jakar `supabase_setup.sql` ka code run kijiye.
 */

const SUPABASE_CONFIG = {
  url: 'https://lfexoqgwdskdiisfkmlm.supabase.co', // Aapka Project URL
  anonKey: 'sb_publishable_aveMJ4z0rH2wooVMbPi7WQ_3HjPTGQ6', // Aapki Anon Key
  bucketName: 'birthday-media'
};