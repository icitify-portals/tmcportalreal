# TMC Portal - Administrator Manual

Welcome to the TMC Portal Administrator Manual. This guide is designed to assist administrators at all levels (National, State, Local, and Branch) in effectively managing the portal's features and resources.

## Table of Contents
1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [User & Member Management](#3-user--member-management)
4. [Organization Management](#4-organization-management)
5. [Finance & Assets](#5-finance--assets)
6. [Events & Activities](#6-events--activities)
7. [Content Management (CMS)](#7-content-management-cms)
8. [System Monitoring](#8-system-monitoring)

---

## 1. Introduction

### Purpose
The TMC Portal is a unified platform for managing the organization's membership, finance, events, and communications across all jurisdiction levels.

### Jurisdictions
The system is hierarchical:
- **National**: Oversees the entire organization.
- **State**: Manages activities within a specific state.
- **Local Government / Area**: Manages local chapters.
- **Branch**: The foundational unit where members are registered.

### Access Levels
Your dashboard features depend on your assigned role (e.g., Admin, Secretary, Finance Officer) and your jurisdiction level.

---

## 2. Getting Started

### Dashboard Overview
Upon logging in, you are presented with the **Admin Dashboard**. This provides a high-level summary of:
- Total Members
- Recent Financial Transactions
- Upcoming Events
- Pending Approvals

### Profile Management
Click on your avatar in the top-right corner to:
- Update your personal details.
- Change your password.
- View your access permissions.

---

## 3. User & Member Management

### Members (`/members`)
This is the core database of the organization.
- **Register Member**: Add new members manually if they cannot self-register.
- **Approval Workflow**: Review pending membership applications.
  - *Verify details -> Approve -> System generates Membership ID.*
- **Search & Filter**: Find members by name, ID, status, or date joined.
- **Export**: Download member lists for offline use.

### Users (`/users`)
Manage system accounts for officials and staff.
- **Create User**: Grant portal access to an individual.
- **Assign Roles**: Link a user to a specific role (e.g., "State Secretary") and jurisdiction.

### Officials (`/officials`)
Manage the executive profiles of the organization.
- **Tenure Management**: Record election/appointment dates and term limits.
- **Profile**: Maintain public bios for officials.

### Roles & Permissions (`/roles`)
(National/System Admins only)
- Define what actions each role can perform.
- Create custom roles if necessary.

### Promotions (`/promotions`)
Handle the elevation of members to new spiritual or organizational ranks.
- **Nominate**: Propose members for promotion.
- **Review**: track the approval process for promotions.

---

## 4. Organization Management

### Organizations (`/organizations`)
This module manages the structural units.
- **Add Branch/Chapter**: Create a new structural unit.
- **Update Details**: Keep address, contact info, and leadership details current.
- **Hierarchy**: View the parent-child relationship between National, State, and Branches.

### Jurisdictions (`/jurisdictions`)
Configure the rules and settings specific to each jurisdiction level.

---

## 5. Finance & Assets

### Finance (`/finance`)
- **Budgets**: Create and track annual or event-based budgets.
- **Fund Requests**: Branches can request funds from higher jurisdictions.
  - *Submit Request -> Review -> Approve/Reject -> Disburse.*
- **Transactions**: View a ledger of all inflows and outflows.

### Payments (`/payments`)
Track all incoming payments from members.
- **Dues**: Monitor annual membership due payments.
- **Donations**: Track voluntary contributions.
- **Reconciliation**: Verify Paystack references against bank records.

### Assets (`/assets`)
Inventory management system.
- **Register Asset**: Record new equipment, furniture, or vehicles.
  - *Include serial numbers, purchase date, and value.*
- **Condition Tracking**: Update status (Good, Damaged, In Repair).
- **Assignment**: Assign assets to specific offices or individuals.

---

## 6. Events & Activities

### Meetings (`/meetings`)
- **Schedule**: Create meetings (Physical or Online).
- **Agenda**: Upload meeting agendas.
- **Attendance**:
  - *Digital Check-in*: Members can mark attendance via the portal.
  - *Manual*: Admins can mark attendance after the event.
- **Minutes**: Secretary uploads minutes after the meeting.

### Programmes (`/programmes`)
Plan large-scale events (Camping, Seminars, etc.).
- **Registration**: Enable member registration for the event.
- **Resources**: Upload event materials.

### Occasions (`/occasions`)
Manage member family events like Nikkah (Wedding) or Naming ceremonies.
- **Requests**: Review member requests for officiating.
- **Scheduling**: Assign officiants and confirm dates.
- **Certificates**: Generate and print certificates.

### Adhkar & Teskiyah (`/adhkar`, `/teskiyah`)
Manage spiritual gathering and purification centers.
- **Centres**: List approved locations and times.
- **Coordinators**: Assign spiritual guides to centres.

### Burials (`/burials`)
Handle funeral requests.
- **Request**: Process urgent burial requests.
- **Logistics**: Arrange necessary services.

---

## 7. Content Management (CMS)

### CMS (`/cms`)
Manage the public-facing website content.
- **Menus**: Configure site navigation.
- **Pages**: Edit static pages (About Us, Contact, etc.).
- **Sliders**: Update homepage banner images.

### Posts (`/posts`)
Publish dynamic content.
- **News**: Organizational updates.
- **Events**: Public event calendars.
- **Announcements**: Critical information for members.

### Galleries (`/galleries`)
- **Albums**: Create photo albums for events.
- **Upload**: Bulk upload images.

### Documents (`/documents`)
A central repository for files.
- **Public**: Resources available to all members.
- **Private**: Internal documents for officials only.

---

## Special Resources Archive (`/dashboard/admin/special-programmes`)

Manage high-value media and historical reports.
- **Categories**: Organize content by Teskiyah Workshops, Friday Khuthbahs, Press Releases, or State of the Nation addresses.
- **Multi-file Support**: Upload multiple audio, video, or document files per programme.
- **Historical Data**: Record the year and specific date of the programme for archiving.
- **Public Visibility**: Choose whether a programme is published to the member-facing Media Library.

---

## 8. System Monitoring

### Analytics (`/analytics`)
Visual insights into system performance.
- **Growth Charts**: Membership trends over time.
- **Financial Graphs**: Income vs. Expenditure.
- **Site Traffic**: Visitor statistics.

### Audit Logs (`/audit`)
(Security Feature)
- View a chronological record of who did what and when.
- Useful for investigating unauthorized changes or errors.

### Settings (`/settings`)
Configure system-wide parameters (e.g., currency, date formats, email templates).

### Payment Integrations (`/dashboard/admin/settings/payments`)
(Superadmin only)
Manage decentralized fund collection via Paystack Subaccounts.
- **Jurisdiction Setup**: Configure settlement bank details for States, LGs, and Branches.
- **Paystack Sync**: Automate the creation of subaccounts on Paystack to ensure funds are routed directly to the specific jurisdiction's bank account.
- **Routing Rules**:
    - If a jurisdiction is linked: Funds go to their bank account.
    - If unlinked: Funds default to the main National account.

---

*For technical support, please contact the National ICT Officer.*
