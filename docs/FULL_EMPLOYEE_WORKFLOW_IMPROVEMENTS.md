# Full Employee Workflow Improvements

This update applies the requested changes to the employee portal:

- Human readable location cards instead of raw coordinates.
- Employee header with photo, name, and job title.
- Reordered home page: welcome, punch, location, quick actions, status, latest records.
- Punch page: branch label, note attached to punch, morning/evening punch priority, small GPS test button, and inside/outside branch labels.
- Temporary toasts instead of persistent alert panels.
- Policy acknowledgement now stores confirmation via the existing endpoint and shows toast feedback.
- Leave and mission requests now include a two-stage workflow: direct manager then HR.
- Added a Team page for direct managers.
- KPI page now uses percentage sliders and weighted calculation logic.
- Disputes now support related employee selection, repetition flags, privacy workflow, and committee routing.

Apply SQL patches 057-060 after 051-056.
