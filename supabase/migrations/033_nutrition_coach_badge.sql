-- Lets a coach see *whether* one of their swimmers has set up a nutrition
-- profile — nothing more. RLS on nutrition_profiles intentionally does not
-- grant coaches row access (that would expose diet pattern/allergies/age),
-- so this is a security-definer boolean check, mirroring is_admin() (008).
create or replace function public.has_nutrition_profile(target_profile_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from nutrition_profiles np
    where np.profile_id = target_profile_id
      and (
        auth.uid() = target_profile_id
        or exists (
          select 1 from swimmers s
          where s.profile_id = target_profile_id and s.coach_id = auth.uid()
        )
      )
  );
$$;
