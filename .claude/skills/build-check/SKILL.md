---
name: build-check
description: Run TypeScript type-checking and Vite production build
disable-model-invocation: true
---

# Build Check

Run the full build pipeline to catch type errors and build issues.

## Steps

1. Run the build command (includes `tsc -b` + Vite production build):

```bash
npm run build
```

2. If the build succeeds, report success and the output directory (`dist/`).

3. If the build fails, analyze the errors:
   - **TypeScript errors:** Show the file, line, and error message. Suggest fixes.
   - **Vite build errors:** Check for missing imports, invalid Tailwind classes, or asset issues.

4. Optionally run the linter as well:

```bash
npm run lint
```

5. Report a summary of any issues found.
