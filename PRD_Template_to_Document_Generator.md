# Product Requirements Document
## Template-to-Document Generator (docx → PDF)

**Version 1.0 | Draft | July 21, 2026**

---

## 1. Overview

This document defines requirements for a web application that lets users upload a .docx template containing manually-marked fields, fill those fields via an auto-generated form, preview the merged result, and generate a final PDF document.

### 1.1 Problem Statement

Teams that repeatedly produce similar documents (contracts, offer letters, certificates, invoices, letters) currently do so by manually copy-pasting data into a Word template each time. This is slow, error-prone, and doesn't scale across a team. There is no self-serve way to turn a static template into a reusable, fillable document generator.

### 1.2 Goals

- Let a non-technical user turn any .docx template into a fillable form in under 2 minutes.
- Guarantee the generated PDF visually matches the original template's formatting.
- Give users a reliable preview before final generation, so mistakes are caught early.
- Support reuse: a template, once uploaded, can be filled and generated many times.

### 1.3 Non-Goals (v1)

- Automatic field detection (OCR / NLP-based blank detection) — v1 requires manual field marking.
- Real-time multi-user collaborative form filling.
- E-signature or approval workflows.
- Template editing inside the app (users edit source templates in Word before upload).

---

## 2. Target Users

| Persona | Description | Primary Need |
|---|---|---|
| Template Owner | Creates/owns document templates (HR, legal, ops, sales) | Mark fields once, share a reusable generator |
| Form Filler | Fills in data for a specific document instance | Simple, guided form; confidence the output is correct |
| Admin | Manages templates & users at org level | Visibility and control over what templates exist |

---

## 3. User Flow

1. **Upload** — User uploads a .docx template file.
2. **Field Detection** — System scans the document for manually marked fields (see §5.1 for syntax) and extracts a field list.
3. **Field Review** — User reviews detected fields, can rename labels, set field type (text/date/number), and mark required fields.
4. **Form Generation** — System generates a data-entry form matching the field list, and saves the template + field schema for reuse.
5. **Fill Data** — A form filler opens the template's form and enters values.
6. **Preview** — System merges entered data into the template and renders a visual preview (paginated, matching final formatting).
7. **Edit or Confirm** — User can go back and edit form values, re-preview, or confirm.
8. **Generate PDF** — System produces the final merged document and converts it to PDF.
9. **Download / Store** — User downloads the PDF (and optionally the merged .docx); the instance is saved to history.

---

## 4. Functional Requirements

### 4.1 Template Upload & Management

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Accept .docx file upload up to 20MB. | P0 |
| FR-2 | Validate file is a well-formed .docx; reject corrupt/legacy .doc files with a clear error. | P0 |
| FR-3 | Store uploaded templates with versioning (re-upload creates a new version, old versions retained). | P1 |
| FR-4 | Allow renaming, archiving, and deleting templates. | P1 |
| FR-5 | List all templates owned by / shared with a user, with last-used date. | P1 |

### 4.2 Field Marking & Detection

| ID | Requirement | Priority |
|---|---|---|
| FR-6 | Detect fields marked using the syntax `{{field_name}}` anywhere in body text, tables, headers, and footers. | P0 |
| FR-7 | Handle fields split across multiple Word XML runs (e.g. due to spell-check or formatting boundaries) so detection isn't broken by Word's internal text fragmentation. | P0 |
| FR-8 | De-duplicate repeated field names (same field appearing multiple times in the doc maps to one form input, applied to all occurrences on merge). | P0 |
| FR-9 | Flag malformed markers (e.g. unclosed `{{`) to the user with the surrounding text shown for context. | P1 |
| FR-10 | Support basic field typing via naming convention or a post-detection UI step (text, date, number, currency). | P2 |

### 4.3 Form Generation & Data Entry

| ID | Requirement | Priority |
|---|---|---|
| FR-11 | Auto-generate a web form with one input per unique detected field, in document order. | P0 |
| FR-12 | Support marking fields required/optional; block submission if required fields are empty. | P0 |
| FR-13 | Persist in-progress form data (draft) so a user can resume later. | P1 |
| FR-14 | Support basic input validation per field type (e.g. date format, numeric). | P2 |

### 4.4 Preview

| ID | Requirement | Priority |
|---|---|---|
| FR-15 | Render a paginated visual preview of the document with entered data merged in, matching the original template's fonts, layout, and styling. | P0 |
| FR-16 | Preview updates when the user edits form data and re-triggers preview (not required to be live/real-time in v1). | P1 |
| FR-17 | Clearly indicate any fields left blank in the preview (e.g. highlighted placeholder). | P1 |

### 4.5 Document Generation & Output

| ID | Requirement | Priority |
|---|---|---|
| FR-18 | Merge submitted data into the .docx, replacing all field markers with values, preserving original formatting. | P0 |
| FR-19 | Convert the merged .docx to PDF server-side. | P0 |
| FR-20 | Provide a downloadable PDF; optionally also offer the merged .docx. | P0 |
| FR-21 | Save each generated document instance to a history log (template used, data snapshot, timestamp, output files). | P1 |

---

## 5. Field Marking Specification

### 5.1 Syntax

Fields are marked manually by the template author, directly inside Word, using double-curly-brace placeholders:

- Basic field: `{{first_name}}`
- Field names: letters, numbers, underscores only; must start with a letter (e.g. `{{invoice_number}}`, `{{client_address_1}}`).
- Field names are case-insensitive and treated as unique identifiers — `{{Name}}` and `{{name}}` map to the same form field.
- Placeholders may appear in body paragraphs, table cells, headers, and footers.

### 5.2 Known Constraint

Word frequently splits a single visible string across multiple underlying XML runs (due to autocorrect, spell-check markers, or manual formatting changes mid-word). The parser must normalize/merge adjacent runs before pattern-matching, or some `{{fields}}` typed naturally in Word will fail to be detected. This is a known, non-trivial edge case and should be covered by test documents during implementation.

---

## 6. Technical Architecture (Proposed)

| Layer | Approach |
|---|---|
| Frontend | Web app (form builder UI, dynamic form renderer, preview viewer) |
| Backend API | Handles upload, field parsing, data storage, merge orchestration |
| Template Parser | Unzips .docx, normalizes XML runs, extracts `{{field}}` markers |
| Merge Engine | Replaces markers with submitted values directly in document.xml, re-zips as .docx |
| PDF Conversion | Headless document conversion service (e.g. LibreOffice/soffice) to render .docx → PDF |
| Storage | Object storage for template files, merged outputs, and generated PDFs |
| Database | Templates, field schemas, form submissions, generation history, users/orgs |

> **Note:** PDF preview and final PDF generation can use the same conversion pipeline, so what the user previews is guaranteed to match the final output exactly.

---

## 7. Data Model (High Level)

| Entity | Key Fields |
|---|---|
| Template | id, name, owner_id, current_version_id, created_at |
| TemplateVersion | id, template_id, file_url, field_schema (JSON), version_number |
| FieldSchema (per field) | name, label, type, required, default_value |
| Submission | id, template_version_id, submitted_by, data (JSON), status (draft/submitted) |
| GeneratedDocument | id, submission_id, docx_url, pdf_url, generated_at |

---

## 8. Non-Functional Requirements

- Preview generation should complete in under 5 seconds for a typical (≤10 page) document.
- PDF conversion pipeline must preserve fonts, images, tables, headers/footers, and page breaks from the source template.
- Uploaded templates and submitted data must be stored securely; access scoped per user/org.
- System should handle templates up to ~50 pages and ~100 fields without significant degradation.

---

## 9. Risks & Open Questions

| Risk / Question | Notes |
|---|---|
| Run-splitting in Word XML | Core technical risk for field detection reliability — needs early prototyping/testing with real-world Word files. |
| PDF conversion fidelity | LibreOffice-based conversion can occasionally shift spacing/fonts vs. native Word rendering — needs visual QA. |
| Field typing (v1 scope) | Do all fields default to plain text in v1, or is basic typing (date/number) required at launch? |
| Template sharing/permissions | Is this single-user in v1, or does it need org/team sharing from day one? |
| Repeating sections | Are there use cases needing repeating rows (e.g. invoice line items), or is v1 flat fields only? |

---

## 10. Proposed Milestones

| Phase | Scope |
|---|---|
| M1 — Core Parser | Upload .docx, detect `{{fields}}`, handle run-splitting, list extracted fields |
| M2 — Form + Merge | Auto-generate form, submit data, merge into .docx |
| M3 — Preview + PDF | PDF conversion pipeline, visual preview, final PDF download |
| M4 — Management Layer | Template versioning, submission history, basic org/user access |

---

*End of document.*
