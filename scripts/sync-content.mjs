import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const tokenPairs = [
  ["Lexora Legal Services", "business.name"],
  ["Lexora", "business.shortName"],
  ["Sharf Uddin Abead", "business.principal"],
  ["Trust | Dedication | Results", "business.tagline"],
  ["Licensed Paralegal | Law Society of Ontario", "business.paralegalCredential"],
  ["Advocate | Supreme Court of Bangladesh", "business.bangladeshCredential"],
  ["Notary Public", "business.notaryCredential"],
  ["tel:+14167223244", "phone.primaryHref"],
  ["tel:+14169000494", "phone.officeHref"],
  ["416-722-3244", "phone.primary"],
  ["416-900-0494", "phone.office"],
  ["3205 Danforth Avenue, Scarborough, ON M1L 1B8", "address.full"],
  ["3205 Danforth Avenue", "address.street"],
  ["M1L 1B8", "address.postalCode"],
].sort((a,b) => b[0].length-a[0].length);
const tokenize = (text) => tokenPairs.reduce((value, [literal,key]) => value.replaceAll(literal, `{{${key}}}`), text);

// CSV reader handles quoted commas, newlines, and escaped quotes without extra dependencies.
function parseCsv(text) {
  const rows=[]; let row=[], cell="", quoted=false;
  for (let i=0;i<text.length;i++) {
    const char=text[i];
    if (char==='"') {
      if (quoted && text[i+1]==='"') {cell+='"';i++;} else quoted=!quoted;
    } else if (char==="," && !quoted) {row.push(cell);cell="";}
    else if (char==="\n" && !quoted) {row.push(cell.replace(/\r$/, ""));rows.push(row);row=[];cell="";}
    else cell+=char;
  }
  if (quoted) throw new Error("Unclosed CSV field");
  if (cell || row.length) {row.push(cell.replace(/\r$/, ""));rows.push(row);}
  return rows.slice(1).filter((row)=>row[0]);
}
const metadata = new Map(parseCsv(read("content/phase-1/06-metadata.csv")).map(([route,title,description,indexing])=>[route,{title,description,productionIndexing:indexing}]));

function sectionsFrom(text) {
  const sections=[]; let section={heading:"Introduction",depth:0,blocks:[]};
  function addParagraph(paragraph) {
    const value=paragraph.trim(); if (!value) return;
    // Route and H1 are represented separately; never silently discard editorial context.
    if (/^Route:/.test(value) || /^H1:/.test(value)) return;
    const kind=/^(Editorial (?:note|status):|Research:|Asset:|Portrait:|Office photograph:)/.test(value) ? "editorial" : /^(?:`)?\[(?:PLACEHOLDER|CONFIRM):/.test(value) ? "placeholder" : "copy";
    section.blocks.push({kind,markdown:tokenize(value)});
  }
  let paragraph=[];
  const flush=()=>{addParagraph(paragraph.join("\n"));paragraph=[];};
  for (const line of text.split("\n")) {
    const heading=/^(#{1,6}) (.+)$/.exec(line);
    if (heading) {flush(); if(section.blocks.length || section.depth>0) sections.push(section);section={heading:tokenize(heading[2]),depth:heading[1].length,blocks:[]};}
    else if(!line.trim()) flush();
    else paragraph.push(line);
  }
  flush();if(section.blocks.length || section.depth>0) sections.push(section);
  return sections;
}
function faqFrom(sections) {
  return sections.filter((section)=>section.depth===3 && section.heading.endsWith("?")).map((section)=>({
    question:section.heading,
    answer:section.blocks.filter((block)=>block.kind!=="editorial").map((block)=>block.markdown).join("\n\n"),
  }));
}
const drafts=[];
function addPage(route, source, text) {
  const meta=metadata.get(route); if(!meta) throw new Error(`Missing metadata: ${route}`);
  const h1=/^H1: (.+)$/m.exec(text)?.[1]; if(!h1) throw new Error(`Missing H1: ${route}`);
  const sections=sectionsFrom(text);
  drafts.push({route,status:"draft",source,h1:tokenize(h1),sections,faqs:faqFrom(sections),metadata:{...meta,title:tokenize(meta.title),description:tokenize(meta.description)}});
}
for(const [route,file] of [
  ["/","01-home.md"],["/about","02-about.md"],["/practice-areas","03-practice-areas.md"],
  ...["traffic-tickets-provincial-offences","accident-benefits-claims","refugee-hearings-appeals","landlord-tenant-matters","employment-human-rights-matters","small-claims-court-matters"].map((slug)=>[`/practice-areas/${slug}`,`practice-areas/${slug}.md`]),
  ["/notary-public","practice-areas/notary-public.md"],
]) {
  const source=`content/phase-1/${file}`;addPage(route,source,read(source));
}
const contactSource="content/phase-1/04-contact-and-system-copy.md";
const contact=read(contactSource);
function extractSection(text,heading) {
  const start=text.indexOf(`## ${heading}\n`);if(start<0)throw new Error(`Missing section ${heading}`);
  const end=text.indexOf("\n## ", start+4);return text.slice(start,end<0?text.length:end);
}
for(const [route,heading] of [["/contact","Contact page"],["/thank-you","Thank-you page"],["404","Custom 404"]]) addPage(route,contactSource,extractSection(contact,heading));
const legalSource="content/phase-1/05-legal-pages.md";
for(const [route,heading] of [["/privacy-policy","Privacy Policy"],["/accessibility","Accessibility"],["/disclaimer","Disclaimer"]]) addPage(route,legalSource,extractSection(read(legalSource),heading));
const shared={status:"draft",source:contactSource,sections:["Optional inquiry acknowledgement email","Shared navigation and footer","Standard service-page CTA"].flatMap((heading)=>sectionsFrom(extractSection(contact,heading)))};
const output=resolve(root,"src/content/generated.ts");
const generated=`// Generated by npm run content:sync. Edit the Markdown/CSV source drafts instead.\nimport type { PageDraft, SharedCopyDraft } from "./types.ts";\n\nexport const pageDrafts = ${JSON.stringify(drafts,null,2)} satisfies PageDraft[];\n\nexport const sharedCopyDraft = ${JSON.stringify(shared,null,2)} satisfies SharedCopyDraft;\n`;
if(process.argv.includes("--check")) {
  if(read("src/content/generated.ts")!==generated) throw new Error("Content is out of sync. Run npm run content:sync.");
  console.log(`Content sync verified: ${drafts.length} route drafts.`);
} else {mkdirSync(dirname(output),{recursive:true});writeFileSync(output,generated);console.log(`Generated ${drafts.length} route drafts and shared copy.`);}
