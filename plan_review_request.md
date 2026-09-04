The task is to implement jurisdiction migration logic in `src/lib/identity/placeshift.ts` separating portable personal standing from location-bound civic registrations.

I plan to:
1. Create `src/lib/identity/placeshift.ts`.
2. Define the types:
   - `Jurisdiction` (e.g., country, subdivision, neighborhood)
   - `CivicRegistration` (things that are location-bound)
   - `PortableStanding` (the 8 facets of standing)
3. Implement a `migrateJurisdiction` (or similar) function that takes a user, their current jurisdiction, and the target jurisdiction.
4. The logic will:
   - Extract portable standing (it travels with the user).
   - Deactivate/Archive location-bound civic registrations from the old jurisdiction.
   - Initialize civic registrations for the new jurisdiction (or keep them pending).
5. Ensure the function integrates well with standard Typescript patterns used in the codebase.
