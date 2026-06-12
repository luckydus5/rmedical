// =============================================================================
// Sanovia — demo data seeder
// =============================================================================
// Creates a realistic, self-consistent demo dataset in the REAL Supabase tables:
// real auth logins, one approved facility, its staff, registered patients, and a
// full set of clinical records. Because it writes to the same tables the app
// uses, anything you then create by hand through the UI behaves identically.
//
// It uses the SERVICE ROLE key, which bypasses RLS — that is correct and
// required for seeding, and it is why this runs server-side only, never in the
// browser. The service role key must never be committed or shipped to the client.
//
// Usage (PowerShell or bash), from the project root:
//   1. Add to your .env (which is gitignored):
//        SUPABASE_SERVICE_ROLE_KEY="...service role key from Supabase dashboard..."
//      VITE_SUPABASE_URL is already in .env.
//   2. Run:
//        node --env-file=.env scripts/seed.mjs
//
// Safe to re-run: it looks up existing demo users by email and updates in place,
// and it clears only the demo patients' own clinical rows before reinserting.
// It never touches data for users it didn't create.
// =============================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '\nMissing config. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env, then run:\n' +
      '  node --env-file=.env scripts/seed.mjs\n'
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = 'Sanovia#Demo2026';

// --- demo people ------------------------------------------------------------
const staff = [
  { email: 'admin@sanovia.demo',   full_name: 'Aline Uwase',     appRole: 'admin',  facilityRole: null,            national_id: '1199012345678901', phone: '+250788000001', gender: 'female' },
  { email: 'director@sanovia.demo',full_name: 'Dr. Eric Mugisha', appRole: 'doctor', facilityRole: 'facility_admin', national_id: '1198512345678902', phone: '+250788000002', gender: 'male' },
  { email: 'doctor@sanovia.demo',  full_name: 'Dr. Claudine Niyonsaba', appRole: 'doctor', facilityRole: 'doctor', national_id: '1198712345678903', phone: '+250788000003', gender: 'female' },
  { email: 'nurse@sanovia.demo',   full_name: 'Patrick Habimana', appRole: 'nurse',  facilityRole: 'nurse',         national_id: '1199212345678904', phone: '+250788000004', gender: 'male' },
];

const patients = [
  { email: 'jeanpaul@sanovia.demo', full_name: 'Jean-Paul Habimana', national_id: '1198001234567801', phone: '+250788100001', gender: 'male',   dob: '1980-03-14', blood: 'O+' },
  { email: 'marieclaire@sanovia.demo', full_name: 'Marie-Claire Ingabire', national_id: '1199201234567802', phone: '+250788100002', gender: 'female', dob: '1992-07-22', blood: 'A+' },
  { email: 'emmanuel@sanovia.demo', full_name: 'Emmanuel Nshimiyimana', national_id: '1197501234567803', phone: '+250788100003', gender: 'male',   dob: '1975-11-02', blood: 'B+' },
  { email: 'grace@sanovia.demo',    full_name: 'Grace Mukamana',     national_id: '1200401234567804', phone: '+250788100004', gender: 'female', dob: '2004-01-30', blood: 'O-' },
  { email: 'samuel@sanovia.demo',   full_name: 'Samuel Bizimana',    national_id: '1196801234567805', phone: '+250788100005', gender: 'male',   dob: '1968-09-09', blood: 'AB+' },
  { email: 'diane@sanovia.demo',    full_name: 'Diane Uwineza',      national_id: '1199801234567806', phone: '+250788100006', gender: 'female', dob: '1998-05-18', blood: 'A-' },
  { email: 'olivier@sanovia.demo',  full_name: 'Olivier Rukundo',    national_id: '1199001234567807', phone: '+250788100007', gender: 'male',   dob: '1990-12-25', blood: 'B-' },
  { email: 'chantal@sanovia.demo',  full_name: 'Chantal Mukandayisenga', national_id: '1198301234567808', phone: '+250788100008', gender: 'female', dob: '1983-08-11', blood: 'O+' },
];

// Clinical data keyed by patient email. The first patient is the "flagship":
// warfarin + aspirin (a critical interaction) and a penicillin allergy with an
// active amoxicillin script, so the drug-interaction engine lights up on screen.
const clinical = {
  'jeanpaul@sanovia.demo': {
    conditions: [
      { condition_name: 'Atrial fibrillation', icd_code: 'I48', status: 'active', severity: 'moderate', diagnosis_date: '2021-02-10' },
      { condition_name: 'Hypertension', icd_code: 'I10', status: 'active', severity: 'moderate', diagnosis_date: '2019-06-01' },
    ],
    medications: [
      { medication_name: 'Warfarin', dosage: '5 mg', frequency: 'Once daily', purpose: 'Anticoagulation', is_active: true, start_date: '2021-02-12' },
      { medication_name: 'Aspirin', dosage: '75 mg', frequency: 'Once daily', purpose: 'Cardioprotection', is_active: true, start_date: '2023-01-05' },
      { medication_name: 'Amoxicillin', dosage: '500 mg', frequency: 'Three times daily', purpose: 'Chest infection', is_active: true, start_date: '2026-06-01' },
    ],
    allergies: [
      { allergen: 'Penicillin', reaction: 'Hives and swelling', severity: 'severe', first_observed: '2010-04-01' },
    ],
    labs: [
      { test_name: 'INR', result_value: '3.8', unit: 'ratio', reference_range: '2.0-3.0', status: 'abnormal', test_date: '2026-06-05', lab_name: 'Demo Clinic Lab' },
      { test_name: 'Blood pressure', result_value: '148/95', unit: 'mmHg', reference_range: '<140/90', status: 'abnormal', test_date: '2026-06-05', lab_name: 'Demo Clinic Lab' },
    ],
    visits: [
      { visit_type: 'specialist', chief_complaint: 'Palpitations', diagnosis: 'AF with rapid ventricular response', treatment: 'Rate control reviewed', visit_date: '2026-06-05' },
    ],
    contacts: [
      { contact_name: 'Esperance Habimana', relationship: 'Spouse', phone: '+250788100051', is_primary: true },
    ],
  },
  'marieclaire@sanovia.demo': {
    conditions: [{ condition_name: 'Type 2 diabetes mellitus', icd_code: 'E11', status: 'active', severity: 'moderate', diagnosis_date: '2022-09-15' }],
    medications: [{ medication_name: 'Metformin', dosage: '1000 mg', frequency: 'Twice daily', purpose: 'Glycaemic control', is_active: true, start_date: '2022-09-20' }],
    allergies: [],
    labs: [{ test_name: 'HbA1c', result_value: '7.9', unit: '%', reference_range: '<7.0', status: 'abnormal', test_date: '2026-05-28', lab_name: 'Demo Clinic Lab' }],
    visits: [{ visit_type: 'checkup', chief_complaint: 'Diabetes review', diagnosis: 'Suboptimal control', treatment: 'Dose increased', visit_date: '2026-05-28' }],
    contacts: [{ contact_name: 'Josiane Ingabire', relationship: 'Sister', phone: '+250788100052', is_primary: true }],
  },
  'emmanuel@sanovia.demo': {
    conditions: [{ condition_name: 'Asthma', icd_code: 'J45', status: 'active', severity: 'mild', diagnosis_date: '2005-03-01' }],
    medications: [{ medication_name: 'Salbutamol inhaler', dosage: '100 mcg', frequency: 'As needed', purpose: 'Bronchodilation', is_active: true, start_date: '2005-03-05' }],
    allergies: [{ allergen: 'Aspirin', reaction: 'Bronchospasm', severity: 'moderate', first_observed: '2008-01-01' }],
    labs: [],
    visits: [{ visit_type: 'checkup', chief_complaint: 'Wheeze', diagnosis: 'Mild asthma exacerbation', treatment: 'Inhaler technique reviewed', visit_date: '2026-04-12' }],
    contacts: [{ contact_name: 'Vestine Nshimiyimana', relationship: 'Spouse', phone: '+250788100053', is_primary: true }],
  },
  'grace@sanovia.demo': {
    conditions: [],
    medications: [],
    allergies: [],
    labs: [{ test_name: 'Malaria RDT', result_value: 'Negative', unit: '', reference_range: 'Negative', status: 'normal', test_date: '2026-06-01', lab_name: 'Demo Clinic Lab' }],
    visits: [{ visit_type: 'checkup', chief_complaint: 'Annual check', diagnosis: 'Healthy', treatment: 'No action', visit_date: '2026-06-01' }],
    contacts: [{ contact_name: 'Beatrice Mukamana', relationship: 'Mother', phone: '+250788100054', is_primary: true }],
    vaccinations: [
      { vaccine_name: 'BCG (Tuberculosis)', dose_number: 1, total_doses: 1, date_administered: '2004-01-30' },
      { vaccine_name: 'Oral Polio Vaccine', dose_number: 1, total_doses: 4, date_administered: '2004-01-30' },
      { vaccine_name: 'Oral Polio Vaccine', dose_number: 2, total_doses: 4, date_administered: '2004-03-12' },
      { vaccine_name: 'Measles-Rubella', dose_number: 1, total_doses: 2, date_administered: '2004-10-30' },
      { vaccine_name: 'HPV (Girls)', dose_number: 1, total_doses: 2, date_administered: '2017-02-10', next_dose_date: '2026-08-01' },
    ],
  },
  'samuel@sanovia.demo': {
    conditions: [{ condition_name: 'Chronic kidney disease stage 3', icd_code: 'N18.3', status: 'active', severity: 'moderate', diagnosis_date: '2023-11-20' }],
    medications: [{ medication_name: 'Amlodipine', dosage: '5 mg', frequency: 'Once daily', purpose: 'Blood pressure', is_active: true, start_date: '2023-11-25' }],
    allergies: [],
    labs: [{ test_name: 'Creatinine', result_value: '180', unit: 'umol/L', reference_range: '60-110', status: 'abnormal', test_date: '2026-05-15', lab_name: 'Demo Clinic Lab' }],
    visits: [{ visit_type: 'follow-up', chief_complaint: 'CKD review', diagnosis: 'Stable CKD 3', treatment: 'Continue therapy', visit_date: '2026-05-15' }],
    contacts: [{ contact_name: 'Agnes Bizimana', relationship: 'Daughter', phone: '+250788100055', is_primary: true }],
  },
  'diane@sanovia.demo': {
    conditions: [],
    medications: [],
    allergies: [{ allergen: 'Sulfa drugs', reaction: 'Rash', severity: 'mild', first_observed: '2019-01-01' }],
    labs: [],
    visits: [{ visit_type: 'checkup', chief_complaint: 'HPV vaccine', diagnosis: 'Immunisation given', treatment: 'HPV dose 1', visit_date: '2026-03-10' }],
    contacts: [{ contact_name: 'Claudette Uwineza', relationship: 'Mother', phone: '+250788100056', is_primary: true }],
  },
  'olivier@sanovia.demo': {
    conditions: [{ condition_name: 'Peptic ulcer disease', icd_code: 'K27', status: 'active', severity: 'moderate', diagnosis_date: '2024-08-02' }],
    medications: [{ medication_name: 'Omeprazole', dosage: '20 mg', frequency: 'Once daily', purpose: 'Acid suppression', is_active: true, start_date: '2024-08-05' }],
    allergies: [],
    labs: [],
    visits: [{ visit_type: 'checkup', chief_complaint: 'Epigastric pain', diagnosis: 'Peptic ulcer', treatment: 'PPI started', visit_date: '2024-08-02' }],
    contacts: [{ contact_name: 'Sandrine Rukundo', relationship: 'Spouse', phone: '+250788100057', is_primary: true }],
  },
  'chantal@sanovia.demo': {
    conditions: [{ condition_name: 'HIV (on ART)', icd_code: 'B20', status: 'active', severity: 'moderate', diagnosis_date: '2015-05-01' }],
    medications: [{ medication_name: 'Efavirenz', dosage: '600 mg', frequency: 'Once daily at night', purpose: 'Antiretroviral therapy', is_active: true, start_date: '2015-05-05' }],
    allergies: [],
    labs: [{ test_name: 'CD4 count', result_value: '620', unit: 'cells/uL', reference_range: '>500', status: 'normal', test_date: '2026-02-20', lab_name: 'Demo Clinic Lab' }],
    visits: [{ visit_type: 'follow-up', chief_complaint: 'ART review', diagnosis: 'Virally suppressed', treatment: 'Continue ART', visit_date: '2026-02-20' }],
    contacts: [{ contact_name: 'Pacifique Mukandayisenga', relationship: 'Brother', phone: '+250788100058', is_primary: true }],
  },
};

// --- helpers ----------------------------------------------------------------
let userCache = null;

async function findUserByEmail(email) {
  if (!userCache) {
    userCache = [];
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      userCache.push(...data.users);
      if (data.users.length < 200) break;
    }
  }
  return userCache.find((u) => u.email?.toLowerCase() === email.toLowerCase()) || null;
}

async function getOrCreateUser(email, full_name) {
  const existing = await findUserByEmail(email);
  if (existing) return existing;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (error) throw error;
  userCache.push(data.user); // keep cache fresh for re-runs within the same run
  return data.user;
}

async function setProfile(userId, fields) {
  // handle_new_user() already inserted a profile row on user creation.
  const { error } = await admin.from('profiles').update(fields).eq('user_id', userId);
  if (error) throw error;
}

async function setAppRole(userId, role) {
  // handle_new_user() inserts ('patient'); collapse to exactly one role row.
  const { error: del } = await admin.from('user_roles').delete().eq('user_id', userId);
  if (del) throw del;
  const { error: ins } = await admin.from('user_roles').insert({ user_id: userId, role });
  if (ins) throw ins;
}

async function clearClinical(patientId) {
  const tables = ['medical_conditions', 'medications', 'allergies', 'lab_results', 'visit_history', 'emergency_contacts', 'vaccinations'];
  for (const t of tables) {
    const { error } = await admin.from(t).delete().eq('patient_id', patientId);
    if (error) throw error;
  }
}

async function insertRows(table, patientId, rows) {
  if (!rows || rows.length === 0) return;
  const withPatient = rows.map((r) => ({ ...r, patient_id: patientId }));
  const { error } = await admin.from(table).insert(withPatient);
  if (error) throw new Error(`${table}: ${error.message}`);
}

// --- preflight --------------------------------------------------------------
// Catch the common "schema not migrated yet" case before writing anything, so a
// missing table produces a clear instruction instead of a half-seeded database.
async function preflight() {
  const { error } = await admin.from('vaccinations').select('id').limit(1);
  if (error && /could not find the table|does not exist|schema cache/i.test(error.message)) {
    console.error(
      '\nThe database schema is not up to date — table "vaccinations" is missing.\n\n' +
        'Apply the migrations first (in this order), then re-run the seed:\n' +
        '  1. supabase/migrations/20260612120000_harden_medical_rls.sql\n' +
        '  2. supabase/migrations/20260612121000_create_vaccinations.sql\n\n' +
        'Easiest way: open the Supabase SQL editor and run each file:\n' +
        `  https://supabase.com/dashboard/project/${SUPABASE_URL.split('//')[1]?.split('.')[0]}/sql/new\n\n` +
        'Then: node --env-file=.env scripts/seed.mjs\n'
    );
    process.exit(1);
  }
}

// --- main -------------------------------------------------------------------
async function main() {
  console.log('Seeding Sanovia demo data...\n');
  await preflight();

  // 1. Staff accounts + roles
  const staffIds = {};
  for (const s of staff) {
    const u = await getOrCreateUser(s.email, s.full_name);
    staffIds[s.email] = u.id;
    await setProfile(u.id, {
      full_name: s.full_name,
      national_id: s.national_id,
      phone: s.phone,
      gender: s.gender,
    });
    await setAppRole(u.id, s.appRole);
    console.log(`  staff   ${s.email.padEnd(26)} -> ${s.appRole}`);
  }

  // 2. Facility (look up by name to stay idempotent)
  let facilityId;
  const { data: existingFacility } = await admin
    .from('facilities')
    .select('id')
    .eq('name', 'Sanovia Demo Clinic')
    .maybeSingle();

  if (existingFacility) {
    facilityId = existingFacility.id;
  } else {
    const { data, error } = await admin
      .from('facilities')
      .insert({
        name: 'Sanovia Demo Clinic',
        facility_type: 'clinic',
        status: 'approved',
        city: 'Kigali',
        country: 'Rwanda',
        phone: '+250788200000',
        email: 'clinic@sanovia.demo',
        license_number: 'MOH-DEMO-0001',
        created_by: staffIds['director@sanovia.demo'],
        approved_by: staffIds['admin@sanovia.demo'],
        approved_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error) throw error;
    facilityId = data.id;
  }
  console.log(`\n  facility Sanovia Demo Clinic -> ${facilityId}\n`);

  // 3. Facility staff links
  for (const s of staff.filter((x) => x.facilityRole)) {
    const { error } = await admin
      .from('facility_staff')
      .upsert(
        { facility_id: facilityId, user_id: staffIds[s.email], role: s.facilityRole, is_active: true },
        { onConflict: 'facility_id,user_id' }
      );
    if (error) throw error;
  }

  // 4. Patients + profiles + roles + facility registration + clinical records
  let patientNumber = 1;
  for (const p of patients) {
    const u = await getOrCreateUser(p.email, p.full_name);
    await setProfile(u.id, {
      full_name: p.full_name,
      national_id: p.national_id,
      phone: p.phone,
      gender: p.gender,
      date_of_birth: p.dob,
    });
    await setAppRole(u.id, 'patient');

    await admin.from('facility_patients').upsert(
      {
        facility_id: facilityId,
        patient_id: u.id,
        patient_number: `DEMO-${String(patientNumber).padStart(4, '0')}`,
        last_visit_at: new Date().toISOString(),
      },
      { onConflict: 'facility_id,patient_id' }
    );
    patientNumber++;

    const data = clinical[p.email] || { conditions: [], medications: [], allergies: [], labs: [], visits: [], contacts: [], vaccinations: [] };
    await clearClinical(u.id);
    await insertRows('medical_conditions', u.id, data.conditions);
    await insertRows('medications', u.id, data.medications);
    await insertRows('allergies', u.id, data.allergies);
    await insertRows('lab_results', u.id, data.labs);
    await insertRows('visit_history', u.id, data.visits.map((v) => ({ ...v, facility_id: facilityId, facility_name: 'Sanovia Demo Clinic' })));
    await insertRows('emergency_contacts', u.id, data.contacts);
    await insertRows('vaccinations', u.id, (data.vaccinations || []).map((v) => ({ ...v, facility_name: 'Sanovia Demo Clinic' })));

    console.log(`  patient ${p.email.padEnd(26)} -> records loaded`);
  }

  console.log('\nDone. Every demo account uses the password below.\n');
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log('\nKey logins:');
  console.log('  admin@sanovia.demo     System administrator');
  console.log('  director@sanovia.demo  Facility admin + doctor');
  console.log('  doctor@sanovia.demo    Doctor');
  console.log('  nurse@sanovia.demo     Nurse');
  console.log('  jeanpaul@sanovia.demo  Patient (warfarin + aspirin + penicillin allergy)');
  console.log('\nSee docs/DEMO.md for the full walkthrough.');
}

main().catch((err) => {
  console.error('\nSeed failed:', err.message || err);
  process.exit(1);
});
