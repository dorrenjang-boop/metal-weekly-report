# Antigravity Rules for metal-weekly-report

## Google Cloud Run & Architecture Rules
This project is deployed on **Google Cloud Run** using a Git-based CI/CD pipeline (Cloud Build). Whenever you are asked to update or refactor this codebase, you MUST adhere to the following strict architectural rules:

1. **NEVER USE LOCAL FILE STORAGE**: Do NOT write code that saves files (like images, uploads, or logs) to the local disk (e.g., `fs.writeFileSync`, local `multer` diskStorage). The server environment is ephemeral. ALWAYS use Google Cloud Storage (`@google-cloud/storage`) for any file persistence.
2. **MAINTAIN `server_cloud.js` ARCHITECTURE**: The `backend/server_cloud.js` is the main entry point for the cloud deployment. It serves both the API and the built Frontend SPA. Do not separate them into two different servers unless explicitly requested by the user for a new microservice architecture.
3. **PORT CONFIGURATION MUST BE 8080 OR 80**: Cloud Run defaults to port 8080. Do not change the `app.listen(PORT)` logic to a hardcoded random port unless it is read from `process.env.PORT`.
4. **DATABASE MIGRATION AWARENESS**: The project initially used SQLite (`reports.db`). Since SQLite is incompatible with Cloud Run's ephemeral nature without specific volume mounts, be extremely cautious. If instructed to add new database features, ensure you are writing queries compatible with the target cloud database (e.g., Firestore or Cloud SQL) if the migration has occurred. Do NOT attempt to create new local `.db` files.
5. **ENVIRONMENT VARIABLES**: Always rely on `process.env` for sensitive keys and bucket names (e.g., `GCS_BUCKET_NAME`). Never hardcode Google Cloud credentials or bucket names in the source files.

## Frontend Architecture & Scalability Rules (React/Vite)
To prevent the codebase from becoming messy as new features (OEE, Project Tracking, etc.) are added, the frontend MUST follow this structure:
1. **Routing**: Use `react-router-dom`. The main `App.jsx` should only define routes and layout wrappers.
2. **Directory Structure**:
   - `src/layouts/`: Contains layout components (e.g., `DashboardLayout.jsx` with Sidebar and Header).
   - `src/pages/`: Contains the entry components for each route (e.g., `WeeklyReportPage.jsx`, `OEEPage.jsx`).
   - `src/components/common/`: Reusable UI components (Buttons, Cards, Modals).
   - `src/components/{domain}/`: Components specific to a feature (e.g., `src/components/weekly/`, `src/components/oee/`).
3. **Design System**: Use a unified premium design (e.g., consistent color palette, glassmorphism, modern typography). Do not use inline styles haphazardly; keep CSS modular or utilize a consistent styling approach.
