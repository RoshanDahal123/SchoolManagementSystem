# School Management System

A full-stack School Management System built with **ASP.NET Core Web API** and **React**, following **Clean Architecture** principles.

## Tech Stack

### Backend

* C#
* ASP.NET Core Web API
* Entity Framework Core
* SQL Server
* Clean Architecture

### Frontend

* React
* TypeScript
* Vite
* Redux Toolkit / RTK Query
* React Hook Form
* Tailwind CSS
* shadcn/ui

## Project Structure

```text
SchoolManagementSystem/
│
├── src/
│   ├── Domain/
│   ├── Application/
│   ├── Infrastructure/
│   └── WebApi/
│
├── tests/
│
├── frontend/
│
├── .gitignore
└── README.md
```

## Architecture

```text
WebApi
  ↓
Application
  ↓
Domain
  ↑
Infrastructure
  ↓
SQL Server
```

Dependency direction:

```text
WebApi → Application
WebApi → Infrastructure

Infrastructure → Application
Infrastructure → Domain

Application → Domain

Domain → Nothing
```

## Development Approach

The backend and frontend will be developed **side-by-side, feature-by-feature**.

```text
Student Feature
    ↓
Backend → API → Frontend
    ↓
Complete & Test

Teacher Feature
    ↓
Backend → API → Frontend
    ↓
Complete & Test
```

Each feature should be completed end-to-end before moving to the next feature.

## Initial Features

* [ ] Student Management
* [ ] Teacher Management
* [ ] Class Management
* [ ] Authentication & Authorization
* [ ] Attendance
* [ ] Exams & Results

## Database

**SQL Server** with **Entity Framework Core**.

EF Core migrations are committed to the repository.

Configuration files containing secrets are not committed:

```gitignore
appsettings.json
appsettings.Development.json
.env
.env.local
```
