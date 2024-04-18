import { createClient } from "@supabase/supabase-js";
export const supabaseUrl = "https://oickznezlteuabtleflb.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pY2t6bmV6bHRldWFidGxlZmxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk2NTk3MDgsImV4cCI6MjAyNTIzNTcwOH0.-7XEngWEQ4ybz2uf3fXXDhX4o-haj2NRIjjw4QW-F0k";
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
