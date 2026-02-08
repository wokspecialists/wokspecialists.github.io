# Open Source Vault Data

This folder powers the Open Source Vault.

Files:
- `catalog.json` — list of resources
- `categories.json` — category definitions
- `collections.json` — curated bundles of resource IDs

Catalog item schema:
```
{
  "id": "unique-id",
  "title": "Display Name",
  "url": "https://example.com/",
  "category": "tools",
  "tags": ["tag1", "tag2"],
  "note": "Short description"
}
```

Add entries to `catalog.json` and they will appear in the Vault.
