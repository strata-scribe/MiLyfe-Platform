1. **Define Types & Validation (`src/lib/governance/petitions.ts`)**
   - Create Zod schemas for `Petition` and `CreatePetition`
   - Create types for the petition and signature structure
   - Create validation rules (e.g., minimum character length, proper format)
2. **Implement `PetitionCard` Component (`src/components/governance/PetitionCard.tsx`)**
   - Import necessary UI components (`Card`, `Button`, `Progress`, `Badge`)
   - Create a presentation component for a single petition
   - Include signature progress visualization (threshold to trigger referendum)
   - Include "Sign" functionality
3. **Implement `PetitionForm` Component (`src/components/governance/PetitionForm.tsx`** (Bonus, but essential for testing the card and creating petitions)
   - Create a form to create a new petition
   - Fields: Title, Description, Target Signatures, End Date
   - Use `react-hook-form` and `zodResolver`
4. **Pre-commit Steps**
   - Run `pre_commit_instructions`
   - Ensure type checking, linting, and basic tests pass
5. **Submit Change**
   - Commit the changes and push
