// ================================
// Sanovia Medical Records PDF Generator
// Generates printable PDF of patient medical records
// ================================

import { format } from 'date-fns';

interface PatientData {
  profile: {
    fullName: string;
    dateOfBirth?: string;
    gender?: string;
    phone?: string;
    nationalId?: string;
    bloodType?: string;
  };
  medications?: any[];
  allergies?: any[];
  conditions?: any[];
  labResults?: any[];
  vaccinations?: any[];
  visits?: any[];
  emergencyContacts?: any[];
}

export function generateMedicalRecordHTML(data: PatientData): string {
  const { 
    profile, 
    medications = [], 
    allergies = [], 
    conditions = [], 
    labResults = [],
    vaccinations = [],
    visits = [],
    emergencyContacts = []
  } = data;

  const activeMedications = medications.filter(m => m.is_active);
  const criticalAllergies = allergies.filter(a => 
    a.severity === 'severe' || a.severity === 'life-threatening'
  );

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Medical Records - ${profile.fullName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #333;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 3px solid #10B981;
      margin-bottom: 20px;
    }
    
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #10B981;
    }
    
    .logo-subtitle {
      color: #666;
      font-size: 12px;
    }
    
    .patient-info {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .patient-name {
      font-size: 20px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    
    .info-item {
      font-size: 11px;
    }
    
    .info-label {
      color: #666;
      font-weight: 500;
    }
    
    .info-value {
      font-weight: bold;
      color: #333;
    }
    
    .blood-type {
      display: inline-block;
      background: #dc2626;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 14px;
    }
    
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: bold;
      color: #10B981;
      padding-bottom: 8px;
      border-bottom: 2px solid #10B981;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .critical-alert {
      background: #fef2f2;
      border: 2px solid #dc2626;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 20px;
    }
    
    .critical-title {
      color: #dc2626;
      font-weight: bold;
      font-size: 13px;
      margin-bottom: 8px;
    }
    
    .allergy-tag {
      display: inline-block;
      background: #dc2626;
      color: white;
      padding: 3px 10px;
      border-radius: 12px;
      margin: 2px;
      font-size: 11px;
      font-weight: 500;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    
    th {
      background: #f1f5f9;
      padding: 8px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e2e8f0;
    }
    
    td {
      padding: 8px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    tr:nth-child(even) {
      background: #f8fafc;
    }
    
    .status-active {
      background: #dcfce7;
      color: #166534;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 500;
    }
    
    .status-inactive {
      background: #f1f5f9;
      color: #64748b;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 10px;
    }
    
    .flag-high {
      color: #dc2626;
      font-weight: bold;
    }
    
    .flag-low {
      color: #2563eb;
      font-weight: bold;
    }
    
    .flag-critical {
      background: #dc2626;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: bold;
    }
    
    .emergency-contacts {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    
    .contact-card {
      background: #f1f5f9;
      padding: 10px;
      border-radius: 6px;
    }
    
    .contact-name {
      font-weight: bold;
      color: #1a1a1a;
    }
    
    .contact-relationship {
      color: #666;
      font-size: 10px;
    }
    
    .contact-phone {
      color: #10B981;
      font-weight: 500;
      margin-top: 4px;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #666;
      font-size: 10px;
    }
    
    .qr-section {
      text-align: center;
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🏥 Sanovia</div>
    <div class="logo-subtitle">Decentralized Medical Records for Africa</div>
  </div>

  <div class="patient-info">
    <div class="patient-name">${profile.fullName}</div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Date of Birth:</span><br>
        <span class="info-value">${profile.dateOfBirth ? format(new Date(profile.dateOfBirth), 'MMM dd, yyyy') : 'Not specified'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Gender:</span><br>
        <span class="info-value">${profile.gender || 'Not specified'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Blood Type:</span><br>
        ${profile.bloodType ? `<span class="blood-type">${profile.bloodType}</span>` : '<span class="info-value">Not specified</span>'}
      </div>
      <div class="info-item">
        <span class="info-label">Phone:</span><br>
        <span class="info-value">${profile.phone || 'Not specified'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">National ID:</span><br>
        <span class="info-value">${profile.nationalId || 'Not specified'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Report Generated:</span><br>
        <span class="info-value">${format(new Date(), 'MMM dd, yyyy HH:mm')}</span>
      </div>
    </div>
  </div>

  ${criticalAllergies.length > 0 ? `
  <div class="critical-alert">
    <div class="critical-title">⚠️ CRITICAL ALLERGIES - DO NOT ADMINISTER</div>
    <div>
      ${criticalAllergies.map(a => `<span class="allergy-tag">${a.allergen} (${a.severity})</span>`).join('')}
    </div>
  </div>
  ` : ''}

  ${allergies.length > 0 ? `
  <div class="section">
    <div class="section-title">🚫 Allergies</div>
    <table>
      <thead>
        <tr>
          <th>Allergen</th>
          <th>Severity</th>
          <th>Reaction</th>
        </tr>
      </thead>
      <tbody>
        ${allergies.map(a => `
        <tr>
          <td><strong>${a.allergen}</strong></td>
          <td>${a.severity}</td>
          <td>${a.reaction || '-'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${activeMedications.length > 0 ? `
  <div class="section">
    <div class="section-title">💊 Current Medications</div>
    <table>
      <thead>
        <tr>
          <th>Medication</th>
          <th>Dosage</th>
          <th>Frequency</th>
          <th>Prescribed By</th>
        </tr>
      </thead>
      <tbody>
        ${activeMedications.map(m => `
        <tr>
          <td><strong>${m.medication_name}</strong></td>
          <td>${m.dosage || '-'}</td>
          <td>${m.frequency || '-'}</td>
          <td>${m.prescribed_by || '-'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${conditions.length > 0 ? `
  <div class="section">
    <div class="section-title">❤️ Medical Conditions</div>
    <table>
      <thead>
        <tr>
          <th>Condition</th>
          <th>Status</th>
          <th>Diagnosed Date</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${conditions.map(c => `
        <tr>
          <td><strong>${c.condition_name}</strong></td>
          <td><span class="${c.status === 'active' ? 'status-active' : 'status-inactive'}">${c.status}</span></td>
          <td>${c.diagnosed_date ? format(new Date(c.diagnosed_date), 'MMM dd, yyyy') : '-'}</td>
          <td>${c.notes || '-'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${labResults.length > 0 ? `
  <div class="section">
    <div class="section-title">🔬 Recent Lab Results</div>
    <table>
      <thead>
        <tr>
          <th>Test</th>
          <th>Result</th>
          <th>Reference</th>
          <th>Flag</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${labResults.slice(0, 10).map(l => `
        <tr>
          <td><strong>${l.test_name}</strong></td>
          <td>${l.result_value} ${l.unit || ''}</td>
          <td>${l.reference_range || '-'}</td>
          <td class="${l.flag === 'high' ? 'flag-high' : l.flag === 'low' ? 'flag-low' : l.flag === 'critical' ? 'flag-critical' : ''}">${l.flag || 'Normal'}</td>
          <td>${l.test_date ? format(new Date(l.test_date), 'MMM dd, yyyy') : '-'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${vaccinations.length > 0 ? `
  <div class="section">
    <div class="section-title">💉 Vaccination History</div>
    <table>
      <thead>
        <tr>
          <th>Vaccine</th>
          <th>Dose</th>
          <th>Date</th>
          <th>Batch Number</th>
          <th>Facility</th>
        </tr>
      </thead>
      <tbody>
        ${vaccinations.map(v => `
        <tr>
          <td><strong>${v.vaccine_name}</strong></td>
          <td>${v.dose_number || 1}/${v.total_doses || 1}</td>
          <td>${v.date_administered ? format(new Date(v.date_administered), 'MMM dd, yyyy') : '-'}</td>
          <td>${v.batch_number || '-'}</td>
          <td>${v.facility || '-'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  ${emergencyContacts.length > 0 ? `
  <div class="section">
    <div class="section-title">📞 Emergency Contacts</div>
    <div class="emergency-contacts">
      ${emergencyContacts.map(c => `
      <div class="contact-card">
        <div class="contact-name">${c.contact_name}</div>
        <div class="contact-relationship">${c.relationship}</div>
        <div class="contact-phone">📱 ${c.phone_number}</div>
      </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p>This document was generated by Sanovia - Decentralized Medical Records for Africa</p>
    <p>Generated on ${format(new Date(), 'MMMM dd, yyyy \'at\' HH:mm:ss')}</p>
    <p>For verification, scan the patient's QR code or visit sanovia.health</p>
  </div>
</body>
</html>
  `;
}

export function printMedicalRecords(data: PatientData): void {
  const html = generateMedicalRecordHTML(data);
  
  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}

export function downloadMedicalRecordsHTML(data: PatientData, filename?: string): void {
  const html = generateMedicalRecordHTML(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `medical-records-${data.profile.fullName.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
