# Blood Donor-to-Hospital Matching System

A web-based blood donor-to-hospital matching system for real-time inventory management using geolocation-based alerts in Kenya.

Final-year project, BBIT, Strathmore University.
Student: Kibati, Maddox Mark (167149) | Supervisor: Dr. Nicodemus Maingi

## Overview

Three roles share one platform:

- **Donor**: registers, manages a blood type profile, views alerts and donation history.
- **Hospital Staff**: posts blood requests to a Regional Storage Center and views inventory.
- **KNBTS Admin**: records donations and manages stock and reference data.

## Tech Stack

| Layer       | Technology                                         |
|-------------|----------------------------------------------------|
| Frontend    | React 19 (Vite), React Router, plain CSS           |
| Backend     | Django 5.2 LTS, Django REST Framework, simplejwt   |
| Database    | PostgreSQL 18 + PostGIS 3.6                        |
| Geolocation | GeoDjango (`PointField`, SRID 4326), GDAL          |

## Repository Structure

```
backend/     Django project (config/) and apps: accounts, donors, staff, hospitals
frontend/    React application (src/api, src/context, src/pages)
```

## Current Status

Implemented (foundation, roughly 30% of the project):

- Full data model from the ERD (User, Donor, Staff, Hospital, RegionalStorageCenter, BloodInventory, BloodRequest, Donation, Notification) with migrations
- JWT authentication and role-based access control (donor, hospital staff, KNBTS admin)
- REST API with CRUD for all entities, scoped by role
- Donation recording that updates `Donor.last_donation_date` and `BloodInventory` in one atomic transaction
- Django admin for all models
- React frontend: login, registration, protected home page

Not yet implemented (planned in later iterations): donor matching engine, push alerts, role-specific dashboards, KNBTS national dashboard, and registration fields for name, phone and blood type.

## Prerequisites

- Python 3.12 (3.13+ may lack compatible wheels)
- Node.js 20.19+ or 22.12+ (required by Vite 8)
- PostgreSQL 18 with the **PostGIS** extension
- GDAL and GEOS libraries (Django's GIS support needs these)
  - **Windows:** install [OSGeo4W](https://trac.osgeo.org/osgeo4w/) (Advanced Install, select the `gdal` package). It installs to `C:\Users\<you>\AppData\Local\Programs\OSGeo4W` or `C:\OSGeo4W`.
  - **Linux:** `sudo apt install gdal-bin libgdal-dev`
- Git

## API Reference

| Endpoint | Method | Access | Purpose |
|---|---|---|---|
| `/api/auth/register/` | POST | Public | Register (`donor` or `hospital_staff`) |
| `/api/auth/token/` | POST | Public | Login, returns JWT access and refresh tokens |
| `/api/auth/token/refresh/` | POST | Public | Refresh access token |
| `/api/auth/me/` | GET | Authenticated | Current user and role |
| `/api/donors/me/` | GET, PATCH | Donor | Own donor profile |
| `/api/donors/me/donations/` | GET | Donor | Own donation history |
| `/api/donors/me/notifications/` | GET | Donor | Own alerts |
| `/api/donors/me/notifications/<id>/` | PATCH | Donor | Accept or decline an alert |
| `/api/staff/me/` | GET, PATCH | Staff, Admin | Own staff profile |
| `/api/hospitals/` | GET | Authenticated | List hospitals |
| `/api/hospitals/regional-storage-centers/` | GET | Authenticated | List storage centers |
| `/api/hospitals/inventory/` | GET | Staff, Admin | View blood inventory (`?regional_storage_center=<id>`) |
| `/api/hospitals/inventory/<id>/` | GET, PATCH | Admin | Correct inventory |
| `/api/hospitals/requests/` | GET, POST | Hospital Staff | Own blood requests |
| `/api/hospitals/requests/<id>/` | GET, PATCH | Hospital Staff | Update own request |
| `/api/hospitals/donations/` | POST | Admin | Record a donation |

## Project Iterations 

1. Requirements and system design
2. Donor portal and authentication
3. Hospital module and matching engine
4. KNBTS dashboard, testing and refinement