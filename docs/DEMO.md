# Sanovia — demo & security runbook

This document gets Sanovia from a clean checkout to a working, presentable demo,
and explains the access-control model behind it (the part a government reviewer
will probe first).

## 1. One-time setup

```sh
npm install
cp .env.example .env        # then fill in the Supabase values
```

`.env` needs:

| Variable | Where it comes from |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase dashboard → Project settings → API |
| `VITE_SUPABASE_PROJECT_ID` | same page |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | the **anon / publishable** key (safe in the browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | the **service role** key — used **only** by the seed script, never shipped to the browser. Keep it out of git. |

## 2. Apply the security migration (do this before the demo)

The eight tables holding patient data were originally created in the Lovable UI,
so their access rules were never in version control. The migration
[`supabase/migrations/20260612120000_harden_medical_rls.sql`](../supabase/migrations/20260612120000_harden_medical_rls.sql)
takes explicit ownership of them and enforces the access model below.

First, see the current state (read-only, changes nothing):

```sh
# paste supabase/verify_security.sql into the Supabase SQL editor, OR:
supabase db query < supabase/verify_security.sql
```

Then apply the migration:

```sh
supabase db push          # if you use the Supabase CLI linked to the project
# or paste the migration file into the SQL editor and run it
```

Re-run `verify_security.sql` afterwards. Every PHI table should show
`rls_enabled = true` with a non-zero policy count, and the "danger list" at the
bottom should be empty.

## 3. Load demo data

```sh
node --env-file=.env scripts/seed.mjs
```

This writes to the **real** tables, so anything you create by hand through the UI
afterwards behaves exactly the same way. It is safe to re-run.

It creates one approved facility (**Sanovia Demo Clinic**, Kigali), its staff,
eight registered patients, and a full set of clinical records.

## 4. Run it

```sh
npm run dev      # http://localhost:8080
```

## 5. Demo accounts

Every account uses the password **`Sanovia#Demo2026`**.

| Login | Role | What to show |
| --- | --- | --- |
| `admin@sanovia.demo` | System admin | Facilities, users, analytics, audit log |
| `director@sanovia.demo` | Facility admin + doctor | Facility dashboard, staff, facility analytics |
| `doctor@sanovia.demo` | Doctor | Open a patient, add a record, see interaction alerts |
| `nurse@sanovia.demo` | Nurse | Register a patient by National ID, view (read-only) |
| `jeanpaul@sanovia.demo` | Patient | Own records, QR share, access log |

## 6. Suggested 5-minute script

1. **Patient owns their data.** Log in as `jeanpaul@sanovia.demo`. Show his
   records, then "Share Access" → generate a QR/code with a short expiry.
2. **Provider gets time-boxed access.** Log in as `doctor@sanovia.demo`, scan or
   paste the code, land on the patient, and point out the banner that the access
   was logged.
3. **The safety feature that matters.** This patient is on warfarin *and* aspirin
   with a penicillin allergy and an active amoxicillin script — the drug
   interaction engine flags the critical combination on screen.
4. **Tamper-evidence.** Log in as `admin@sanovia.demo` → Audit Logs → "Verify
   chain". The log is hash-chained and append-only; the database physically
   blocks edits and deletes.
5. **Isolation.** Back as the patient, show that "Access Log" lists exactly who
   opened the file and when.

## 7. Access-control model (the security answer)

Enforced in the database by RLS — not by the UI, which is only a convenience
layer. A clinical record (conditions, medications, allergies, labs, visits,
emergency contacts) is readable/writable **only** by:

- the **patient** themselves;
- a **system admin**;
- a provider who is **active staff at a facility where that patient is
  registered**; or
- a provider holding a **live, patient-issued share grant** (QR / access token).

Everyone else gets nothing — including another patient, and including a doctor at
an unrelated facility. The central rule lives in one function,
`public.can_access_patient()`, so it is auditable in a single place.

**Will a patient see another patient's data?** No. A patient is not staff
anywhere and holds no grant to anyone else, so `can_access_patient` returns false
and the database returns zero rows, regardless of what the client requests.

### Deliberate exception

`profiles` (name, National ID, phone) stays readable by any provider so a nurse
can find a patient by National ID to register or refer them. Identity lookup is
not clinical-record access. If your privacy policy forbids even cross-facility
identity search, tighten the `profiles` SELECT policy.

## 8. Honest status — what is real vs. not yet

**Working and real:** auth + MFA, role-based dashboards, facility registration,
patient records CRUD, QR sharing with access logging, the drug-interaction
engine, the hash-chained audit log, facility analytics computed from live data,
vaccination tracking against the WHO/Rwanda schedule, PDF export, offline caching.

**Not production-ready yet (be ready to say so):**

- **AI Features admin page** shows illustrative usage figures, not real telemetry.
- **Data residency:** hosted on Supabase's cloud. A national system will need a
  data-sovereignty plan (in-country / self-hosted) before procurement.
- **No independent security audit yet.** The RLS model above is sound but should
  be pen-tested by a third party; that report is worth more than any feature.
- **Interoperability:** no HL7 FHIR / DHIS2 integration, which Rwanda's health
  stack will expect.
