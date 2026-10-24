import { site } from "@/config/site";

export default function ProjectStatus() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-slate-900">
      <p className="text-sm">Project workspace · Phase 1</p>
      <h1 className="mt-4 text-3xl font-semibold">{site.business.name}</h1>
      <p className="mt-4 leading-7">
        Content drafts are prepared for review. Website design and page
        implementation will begin after the next phase is authorized.
      </p>
    </main>
  );
}
