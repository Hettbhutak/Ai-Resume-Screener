# Frontend Structure

This frontend is split into feature files under `frontend/js` for easier debugging.

- `frontend/js/01-state.js`
  - Global sample data, backend state vars, API base URL, and email templates.
- `frontend/js/02-core-ui.js`
  - Navigation, modal handlers, tabs, backend job sync helpers, and shared API helper.
- `frontend/js/03-candidates.js`
  - Candidates page rendering, filters, status chips, shortlist/reject actions, talent pool, templates preview, and candidate details modal.
- `frontend/js/04-bulk-screening.js`
  - Bulk upload flow, job creation, resume upload, status polling, score rendering, shortlist actions, CSV export.
- `frontend/js/05-search-tabs.js`
  - AI search, JD upload/clear, candidate timeline and email history tab rendering.
- `frontend/js/06-email-init.js`
  - Email send/template behavior and app initialization (drag-drop + initial backend sync).

## Load Order

Scripts are loaded in this order from `frontend/index.html` and depend on globals from earlier files:

1. `01-state.js`
2. `02-core-ui.js`
3. `03-candidates.js`
4. `04-bulk-screening.js`
5. `05-search-tabs.js`
6. `06-email-init.js`

Keep this order unless you convert the project to ES modules.

