# Antigravity Rules for metal-weekly-report

## Google Cloud Run & Architecture Rules
This project is deployed on **Google Cloud Run** using a Git-based CI/CD pipeline (Cloud Build). Whenever you are asked to update or refactor this codebase, you MUST adhere to the following strict architectural rules:

1. **NEVER USE LOCAL FILE STORAGE**: Do NOT write code that saves files (like images, uploads, or logs) to the local disk (e.g., `fs.writeFileSync`, local `multer` diskStorage). The server environment is ephemeral. ALWAYS use Google Cloud Storage (`@google-cloud/storage`) for any file persistence.
2. **MAINTAIN `server_cloud.js` ARCHITECTURE**: The `backend/server_cloud.js` is the main entry point for the cloud deployment. It serves both the API and the built Frontend SPA. Do not separate them into two different servers unless explicitly requested by the user for a new microservice architecture.
3. **PORT CONFIGURATION MUST BE 8080 OR 80**: Cloud Run defaults to port 8080. Do not change the `app.listen(PORT)` logic to a hardcoded random port unless it is read from `process.env.PORT`.
4. **DATABASE MIGRATION AWARENESS**: The project initially used SQLite (`reports.db`). Since SQLite is incompatible with Cloud Run's ephemeral nature without specific volume mounts, be extremely cautious. If instructed to add new database features, ensure you are writing queries compatible with the target cloud database (e.g., Firestore or Cloud SQL) if the migration has occurred. Do NOT attempt to create new local `.db` files.
5. **ENVIRONMENT VARIABLES**: Always rely on `process.env` for sensitive keys and bucket names (e.g., `GCS_BUCKET_NAME`). Never hardcode Google Cloud credentials or bucket names in the source files.
