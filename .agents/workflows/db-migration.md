# /db-migration <name>

1. `supabase migration new <name>`.
2. Write forward-only SQL: table/column changes, indexes, RLS enable + policies, triggers. Add a comment
   block at the top stating intent and which `docs/DATABASE.md` section it implements/changes.
3. `supabase db reset` locally; fix until clean.
4. Update `docs/DATABASE.md` to match.
5. `supabase gen types typescript --local > src/lib/supabase/database.types.ts`; commit the regenerated file.
6. Write/extend the RLS test for the affected table(s) (anonymous denied, wrong customer denied, wrong
   staff role denied, correct role allowed).
7. Never apply a migration to the linked remote project without the owner's explicit go-ahead in that
   message (rule 05).
