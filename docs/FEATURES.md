# Feature reference

A map of Sanovia's main features to the modules that implement them. See the [README](../README.md) for setup instructions.

| Feature | Implementation |
| --- | --- |
| Drug interaction checks | `src/lib/drugInteractions.ts`, `src/components/ai/DrugInteractionAlert.tsx` |
| Offline support and sync | `src/lib/offlineStorage.ts`, `src/lib/syncEngine.ts`, `src/components/offline/OfflineIndicator.tsx` |
| Localization (en, rw, sw, fr) | `src/locales/i18n.ts`, `src/locales/*.json`, `src/components/common/LanguageSwitcher.tsx` |
| Emergency access card | `src/components/emergency/EmergencyAccessCard.tsx` |
| Vaccination tracking | `src/components/vaccination/VaccinationTracker.tsx` |
| Health alerts | `src/components/alerts/SmartHealthAlerts.tsx` |
| PDF export | `src/lib/pdfGenerator.ts`, `src/components/export/ExportRecordsButton.tsx` |
| Facility analytics | `src/components/analytics/AnalyticsDashboard.tsx` |
| Record sharing via QR | `src/components/sharing/QRCodeGenerator.tsx`, `src/components/sharing/QRScanner.tsx` |
| Multi-factor authentication | `src/components/auth/MFAChallenge.tsx`, `src/components/auth/MFASettings.tsx` |
| Access audit log | `src/components/access/AccessLogViewer.tsx` |

## Notes

- The drug interaction dataset covers WHO Essential Medicines plus drugs common in East Africa (antimalarials, ARVs).
- The vaccination schedule follows the WHO/Rwanda immunization calendar (BCG, OPV, Pentavalent, PCV, Rotavirus, Measles-Rubella, Yellow Fever).
- Offline storage uses IndexedDB via `idb`; the sync engine reconciles local writes when connectivity returns.
