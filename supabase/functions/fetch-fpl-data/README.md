# FPL Data Ingestion Function

This Edge Function fetches data from the Fantasy Premier League API and populates the following tables:
- teams
- events (gameweeks)
- game_settings
- element_types (positions)
- chips
- players

## Endpoints

### GET /fetch-fpl-data

Fetches all FPL data and updates the database tables.

Response format:
```json
{
  "success": true,
  "message": "Data ingestion completed successfully"
}
```

Error response:
```json
{
  "success": false,
  "error": "Error message details"
}
```