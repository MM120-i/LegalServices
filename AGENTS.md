# Project conventions

## Readability and formatting

- Follow the surrounding code and Mahim’s existing formatting edits.
- Use two-space indentation, spaces around operators and after commas, double quotes, and semicolons, consistent with the project’s Prettier configuration.
- Use blank lines to separate logical steps: declarations/setup, validation or guard clauses, side effects, and return statements. Keep related declarations together when that reads naturally.
- Preserve intentional blank lines between import groups and between distinct checks. Avoid compacting unrelated statements onto one line.
- Preserve user edits. Do not reformat unrelated files as part of a focused change.

## Tests and scripts

- Put automated test cases in the root `tests/` directory, using `.test.ts` or `.test.mjs` filenames and Node’s built-in test runner.
- Keep `scripts/` for operational utilities, such as generating or checking synchronization of content files.
- `npm test` runs content and contact tests, including the content synchronization check.
- `npm run pages:check` runs the built-page tests after `npm run build`.
- `npm run check` also runs TypeScript and ESLint checks.
- Keep email tests mocked; do not send real inquiries as part of automated testing.
