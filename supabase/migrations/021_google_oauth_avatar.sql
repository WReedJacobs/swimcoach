-- ─── 021_google_oauth_avatar.sql ─────────────────────────────────────────────
-- Google sign-in (added via supabase.auth.signInWithOAuth) creates the same
-- auth.users row as password signup, so handle_new_user (017) already covers
-- it for full_name/email. Google's identity payload additionally supplies a
-- profile photo under raw_user_meta_data.avatar_url (sometimes .picture on
-- older linked identities) — copy that in too, and backfill existing rows.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url)
    WHERE public.profiles.email IS NULL OR public.profiles.email = '';
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

UPDATE public.profiles p
SET avatar_url = COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
FROM auth.users u
WHERE u.id = p.id
  AND p.avatar_url IS NULL
  AND COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture') IS NOT NULL;
