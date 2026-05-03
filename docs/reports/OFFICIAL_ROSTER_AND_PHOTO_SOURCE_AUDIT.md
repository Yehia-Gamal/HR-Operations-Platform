# Official Roster and Photo Source Audit

Date: 2026-05-02

## Sources Found

- Excel: `C:\Users\Elhamd\Desktop\بيانات الموظفين.xlsx`
- Photos zip: `C:\Users\Elhamd\Downloads\موظفين الجمعية.zip`

The Excel workbook exists and contains 28 numbered employee rows. Some cells are stored as empty/merged cells in the raw XLSX XML, so the project continues to use `docs/templates/authorized-employees-import.json` as the normalized import file generated from the workbook.

## Photo Zip Summary

- Image files in zip: 22
- Employee avatar images matched by the project map: 20
- Non-employee/unlinked images: 2

Unlinked images:

- `موظفين الجمعية/WhatsApp Image 2026-04-27 at 4.16.13 PM.jpeg`
- `موظفين الجمعية/لوجو احلي شباب 2.png`

Employees without matched photos:

- AHS-012
- AHS-014
- AHS-019
- AHS-022
- AHS-023
- AHS-025
- AHS-027
- AHS-028

## Production Handling

Personal photos must remain out of public frontend folders. Upload only matched avatar files to Supabase Storage bucket `avatars` using the preserved paths under `employee-avatars/`.
