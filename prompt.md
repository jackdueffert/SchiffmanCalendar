You are analyzing a business document — typically a commercial real estate lease, amendment, contract, or related exhibit. Your job is to extract every important date and deadline from the document.

Read the file at the path provided at the end of this prompt. Be thorough: check all sections, schedules, exhibits, and amendments.

Extract events of these four types:

1. **expiration** — Lease expiration dates, contract end dates, agreement termination dates, option period end dates.

2. **rent_increase** — Any scheduled rent escalation: fixed bumps, percentage increases, CPI adjustments, stepped rents. If rent increases annually, create one event per occurrence.

3. **option** — Option exercise deadlines the tenant/party must act on: purchase options, renewal/extension options, right of first refusal (ROFR) deadlines, expansion options. Include the notice deadline (the date by which the option must be exercised), not just the option effective date.

4. **critical** — All other time-sensitive dates: notice periods, cure periods, termination rights, co-tenancy triggers, exclusivity clause deadlines, insurance renewal dates, compliance deadlines, inspection/audit windows, any date the document explicitly calls out as a deadline or milestone.

For each event, return a JSON object with exactly these fields:
- "title": short descriptive label (e.g., "Lease Expiration", "3% Annual Rent Increase", "Purchase Option Deadline", "Tenant Notice to Vacate")
- "date": the date in ISO 8601 format YYYY-MM-DD. If only a month/year is given, use the last day of that month. If only a year is given, use December 31 of that year. If the date cannot be determined at all, omit the event.
- "type": one of exactly: "expiration", "rent_increase", "option", "critical"
- "description": 1–2 sentences of context pulled directly from the document — include the relevant clause number, percentage/dollar amount, or notice requirement where applicable.

Return ONLY a valid JSON array — no markdown, no code fences, no explanation, no preamble. Start your response with [ and end with ].

If no relevant dates are found, return: []

Example of correct output:
[
  {
    "title": "Primary Lease Expiration",
    "date": "2028-06-30",
    "type": "expiration",
    "description": "Initial lease term expires per Section 2.1. Tenant must provide 180 days written notice of intent to vacate."
  },
  {
    "title": "3% Annual Rent Increase",
    "date": "2026-01-01",
    "type": "rent_increase",
    "description": "Base rent increases 3% per Section 4.2 on the first day of each lease year beginning Year 2."
  },
  {
    "title": "Renewal Option Exercise Deadline",
    "date": "2027-12-31",
    "type": "option",
    "description": "Tenant must deliver written notice of renewal option exercise no later than 180 days prior to lease expiration per Section 38."
  }
]
