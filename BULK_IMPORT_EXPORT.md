# Bulk Import/Export API

These endpoints provide organization-scoped bulk data operations for Leads and Opportunities. All routes enforce authentication and Row Level Security (RLS) via `organization_id`.

## Rate limiting
- Basic per-IP limit is applied. Exceeding requests receive HTTP 429.

## Formats
- Import: JSON payload with validated rows, or CSV upload via UI (parsed client-side)
- Export: JSON (default) or CSV via `?format=csv`

## Leads

### Import
- POST `/api/bulk/leads/import`
- Body (JSON):
```
{
  "rows": [
    {
      "first_name": "Jane",
      "last_name": "Doe",
      "email": "jane@example.com",
      "phone": "+1-555-1234",
      "company": "Acme",
      "source": "event",
      "status": "new",
      "external_id": "L-001"
    }
  ]
}
```
- CSV headers accepted via UI (example):
```
first_name,last_name,email,phone,company,source,status,external_id
Jane,Doe,jane@example.com,+1-555-1234,Acme,event,new,L-001
```
- Response: `{ success: boolean, inserted: number, failed: number, errors: { index: number, message: string }[] }`

Notes:
- `first_name` required; others optional.
- Inserted rows are automatically stamped with `organization_id` and `created_by` from the current user.

### Export
- GET `/api/bulk/leads/export?format=csv&limit=1000&status=new`
- Response: CSV or `{ data: [...] }` for JSON.
- Columns: `id,first_name,last_name,email,phone,company,source,status,created_at`

## Opportunities

### Import
- POST `/api/bulk/opportunities/import`
- Body (JSON):
```
{
  "rows": [
    {
      "name": "Deal A",
      "description": "...",
      "value": 5000,
      "probability": 30,
      "stage": "prospecting",
      "close_date": "2025-12-31",
      "company_id": "<uuid>",
      "contact_id": "<uuid>",
      "assigned_to": "<uuid>",
      "external_id": "OP-123"
    }
  ]
}
```
- CSV headers accepted via UI (example):
```
name,description,value,probability,stage,close_date,company_id,contact_id,assigned_to,external_id
Deal A,Example,5000,30,prospecting,2025-12-31,00000000-0000-0000-0000-000000000000,,,,OP-123
```
- `value` also accepted as `deal_value` if present.
- Response: `{ success, inserted, failed, errors }`

### Export
- GET `/api/bulk/opportunities/export?format=csv&limit=1000&stage=prospecting`
- Columns: `id,name,description,value,probability,stage,close_date,company_id,contact_id,assigned_to,created_at`

## Security and RLS
- Each request authenticates with `AuthService.getServerClient()`.
- Data is filtered by the caller’s `organization_id` fetched from user context.
- Inserts always include `organization_id` and `created_by`.

## Limits and performance
- Imports are chunked (Leads: 500/req, Opportunities: 300/req) to avoid payload limits.
- Export `limit` defaults to 1000 and caps at 10,000 via validation.

## Errors
- 401: Unauthorized
- 403: Missing organization context
- 429: Rate limited
- 500: Internal server error
