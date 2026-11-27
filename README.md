# Abead Legal Services Professional Corporation

Responsive paralegal-practice website built with Next.js App Router, TypeScript, and Tailwind CSS.

Deployed on Netlify.

## GitHub CI

`.github/workflows/ci.yml` checks pull requests, pushes to `main`, and manual runs. It uses Node 22 on Ubuntu, installs the lockfile with `npm ci`, and runs content synchronization, mocked contact/review tests, TypeScript, ESLint, a production-mode build, and local HTTP checks for links, SEO, privacy disclosures and legacy redirects. Npm downloads are cached; obsolete runs are cancelled.

No GitHub secrets are needed. Email and review storage credentials are explicitly blank. Tests use a reserved QA origin and loopback servers; CI does not publish, send real email or access production review data. Netlify remains the deployment service. Browser/device tests that currently depend on a local Microsoft Edge installation are separate from this workflow.

Run the same checks locally:

```sh
npm run check
npm run ci:build
npm run ci:runtime
```

After pushing the workflow, open the repository's **Actions → CI** to confirm its first hosted run. To require a green check before merging, add the **Tests, types, lint and build** check to a ruleset for `main` and require pull requests. The workflow alone does not prevent direct pushes or make Netlify wait for CI; merge approved pull requests after checks pass. These GitHub repository settings are not changed by the local workflow file.
