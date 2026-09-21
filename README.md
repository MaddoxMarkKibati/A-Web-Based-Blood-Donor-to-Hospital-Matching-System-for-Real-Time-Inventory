# Blood Donor-to-Hospital Matching System

A web-based blood donor-to-hospital matching system for real-time inventory management using geolocation-based alerts in Kenya.

Final-year project, BBIT, Strathmore University.

## Overview

Three roles share one platform:

- **Donor**: registers, manages a blood type profile, receives geolocation-based alerts and responds to requests.
- **Hospital Staff**: posts urgent blood requests, views ranked donor matches and regional storage center inventory.
- **KNBTS Admin**: monitors national stock levels and records donations.

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | React (Vite)                                    |
| Backend    | Django, Django REST Framework, simplejwt        |
| Database   | PostgreSQL 18 + PostGIS 3.6                     |
| Geolocation| Browser Geolocation API                         |
| Alerts     | Web Push (Push API + service worker)            |

## Repository Structure

```
backend/     Django project and REST API
frontend/    React application
```

## Prerequisites

- Python 3.12
- Node.js 20+
- PostgreSQL 18 with the PostGIS extension
- Git

## Setup

Backend and frontend setup instructions will be added as each part is built.

## Project Status

Development follows the four iterations in the project proposal:

1. Requirements and system design
2. Donor portal and authentication
3. Hospital module and matching engine
4. KNBTS dashboard, testing and refinement

Current target: basic CRUD, backend and frontend foundations.