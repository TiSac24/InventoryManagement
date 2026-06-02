# InventoryPro Management System

A premium, modern Inventory and Order Management System built with a **FastAPI backend** (running SQLAlchemy and SQLite) and a **React (TypeScript + Vite + Tailwind CSS) frontend**.

---

## Prerequisites
Ensure you have the following installed on your machine:
* **Node.js** (v18 or higher recommended)
* **Python** (v3.10 or higher recommended; python 3.14+ is fully supported out-of-the-box!)

---

## Project Structure
* `backend/` - FastAPI backend application.
* `frontend/` - React frontend application.

---

## Running the Application

Both the backend and frontend servers are currently running on your system! 

* **Backend API URL:** `http://127.0.0.1:8000`
* **Frontend Application URL:** `http://localhost:3000`

If you ever need to stop and run them again, follow the steps below.

### 1. Running the Backend (FastAPI)

1. Open a terminal and navigate to the `backend` directory:
   ```powershell
   cd d:\project-bolt-sb1-on5jqb1f\project\backend
   ```
2. Activate the pre-configured Python virtual environment:
   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```
3. Start the Uvicorn development server:
   ```powershell
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
4. **API Interactive Docs:** Once running, you can explore the API endpoints interactively at `http://127.0.0.1:8000/docs` (Swagger UI).

> [!NOTE]
> The backend database defaults to a local SQLite database (`backend/inventory.db`).
> On the first startup, the database is automatically created and seeded with realistic sample products, customers, and order history so you can immediately see data on the dashboard.
> If you wish to connect to a PostgreSQL database, you can set the `DATABASE_URL` environment variable:
> `$env:DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"`

---

### 2. Running the Frontend (React + Vite)

1. Open a separate terminal and navigate to the `frontend` directory:
   ```powershell
   cd d:\project-bolt-sb1-on5jqb1f\project\frontend
   ```
2. Start the Vite development server:
   ```powershell
   npm run dev
   ```
3. Open `http://localhost:3000` in your web browser.

---

## Available Pages
* **Dashboard:** Visualizes key performance indicators (KPIs) like total products, total customers, total orders, total revenue, and alerts for out-of-stock or low-stock items.
* **Products:** Complete CRUD management for products, including SKU generation, pricing, and stock levels.
* **Customers:** Customer database management.
* **Orders:** Order placement and order tracking that automatically reduces product inventory levels when placed.
