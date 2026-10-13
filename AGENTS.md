<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Database: push only, never migrations

Use `npm run db:push` (`drizzle-kit push`) to apply schema changes to the database. Never generate or run migrations (`drizzle-kit generate` / `drizzle-kit migrate`) and never commit a `drizzle/` migrations folder.

# Development project: no backwards compatibility, data is worthless

This is a development project. There is no backwards compatibility and the data is worthless. Prefer data loss: never backfill, migrate, or preserve existing rows, and never spend effort keeping old data working. Every schema change means a clean slate.

# Forms

Build forms with this stack, in this shape (reference: `components/bot-dialog.tsx`, `actions/bot.ts`, `insertBotSchema` in `lib/db/schema.ts`).

- **One schema, shared.** Derive the validation schema from the Drizzle table with `createInsertSchema` (`drizzle-zod`) in `lib/db/schema.ts`. Pass refinement callbacks for messages and limits (`name: (s) => s.trim().min(1, "...")`), then `.omit()` every server-owned column (`id`, `userId`, timestamps, etc.). Export the schema and its `_output` type. The client form and the server action both use this same schema; never hand-write a duplicate.
- **Client form.** `react-hook-form` + `zodResolver` (`@hookform/resolvers/zod`) with `Controller` per field. Mark the file `"use client"`. Keep default values in a function (e.g. `emptyValues()`) so reset and generated defaults (like `nanoid()` seeds) get fresh values.
- **shadcn layout.** Use `FieldGroup` + `Field` + `FieldLabel` + `FieldError` from `@/components/ui/field`, never raw `div`s with spacing. Validation: `data-invalid` on `Field`, `aria-invalid` on the control. Use `Input`/`Textarea` with `{...field}` and an `id` matching `htmlFor`.
- **Submit button.** No `isLoading` prop: render `<Spinner data-icon="inline-start" />` and `disabled={isSubmitting}`. When the button sits in a footer outside the `<form>`, give the form an `id` and use `type="submit" form="<id>"`.
- **Dialogs.** Compose `@/components/ui/dialog` (Base UI): `DialogTrigger render={trigger}`, plus `DialogTitle`/`DialogDescription`. Accept the trigger as a `ReactElement` prop so server pages can pass their own button. Reset the form when the dialog closes. Cancel uses `DialogClose render={<Button variant="outline" />}`.
- **Width overrides.** `DialogContent` defaults to `max-w-[calc(100%-2rem)] sm:max-w-sm`, and the `cn` helper does not resolve conflicts, so a plain `sm:max-w-lg` can lose. Use the important modifier, e.g. `max-w-[min(32rem,calc(100%-2rem))]!`.
- **Server actions.** Put them in `actions/<entity>.ts` with `"use server"`. Always: (1) get `userId` from `auth()` in `@clerk/nextjs/server` and reject if missing, (2) `safeParse` the input with the shared schema (treat input as `unknown`), (3) write with Drizzle using the server-supplied `userId`, never one from the client, (4) `revalidatePath` the affected route. Return a result object (`{ ok: true, id } | { ok: false, error }`), not thrown errors; the client shows failures with `form.setError("root", ...)`.
- **Optional text columns.** The form holds `""`; the action converts it to `null` before insert.
- **Server pages stay server components.** Wire client dialogs/forms into pages by passing the trigger element; don't mark the page `"use client"`.
- **Verify.** Run `npx tsc --noEmit` and `npx eslint` on touched files.



## DiceBear

Use DiceBear 10. Documentation: https://www.dicebear.com/llms.txt

There are seven native cores with identical output, not one library with
wrappers. Use the one matching this project's language. Do not reach for the
JavaScript core when the project is written in something else:

    JavaScript  @dicebear/core + @dicebear/styles
    PHP         dicebear/core + dicebear/styles
    Python      dicebear-core + dicebear-styles
    Rust        dicebear-core + dicebear-styles
    Go          github.com/dicebear/dicebear-go/v10 + github.com/dicebear/styles/v10
    Dart        dicebear_core + dicebear_styles
    C#          DiceBear.Core + DiceBear.Styles

Every style page carries a loading snippet for all seven, for example
https://www.dicebear.com/styles/lorelei/index.md

HTTP API: https://api.dicebear.com/10.x/<style>/svg?seed=<seed> The seed is a
query parameter, not a path segment. Options are query parameters too; array
values are separated by commas.

Options named after a component end in Variant: eyesVariant, not eyes. This
holds in all seven cores and in the HTTP API. Look up the options of a style at
https://api.dicebear.com/10.x/<style>/options.json

Write these forms, not the ones on the left. The left column is pre-10 and the
API does not reject it, so an outdated call runs and silently does the wrong
thing:

    avatars.dicebear.com/api/<style>/<seed>.svg  ->  api.dicebear.com/10.x/<style>/svg?seed=<seed>
    api.dicebear.com/9.x/<style>/svg             ->  api.dicebear.com/10.x/<style>/svg
    npm install @dicebear/collection             ->  npm install @dicebear/styles
    npm install @dicebear/lorelei                ->  npm install @dicebear/styles
    createAvatar(lorelei, { seed })              ->  new Avatar(new Style(definition), { seed })
    { eyes: ['variant01'] }                      ->  { eyesVariant: ['variant01'] }
    ?radius=50                                   ->  ?borderRadius=50

Only JavaScript and the HTTP API have a pre-10 form. The other six cores were
released in 2026 and never had one, so any older-looking PHP, Python, Rust, Go,
Dart or C# API attributed to DiceBear is invented rather than outdated.
# Deployment: Railway env vars

Production runs on Railway (project `ai-teamates`, service `ai-teamates`, environment `production`). When adding or changing env vars, also set them on Railway (use the `use-railway` skill, e.g. `railway variable set --skip-deploys KEY=value`; a push to `main` deploys).

`TRIGGER_SECRET_KEY` is the exception: Trigger.dev needs a **different key for production** than the dev key in `.env.local`. Never copy it from `.env.local` to Railway. The production value is already set on Railway; leave it alone unless the user supplies a new prod key.
