import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export type Profile = {
  id: string;
  nickname: string;
  kind: "student" | "teacher";
  teacher_verified: boolean;
  is_admin: boolean;
};
