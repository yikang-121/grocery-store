# CHAPTER 3: METHODOLOGY AND PLANNING

This chapter describes the design approach and the planning methodology adopted for the development of the E-Commerce Website and Inventory System. By utilizing the Agile Scrum framework, the project ensures iterative delivery and continuous alignment with the core project objectives.

## 3.1 Introduction
The development of a full-stack grocery inventory system requires a flexible methodology that can handle complex backend logic and user interface design simultaneously. This chapter details the Scrum roles, artifacts, and events that guided the project throughout its 12-sprint lifecycle.

## 3.2 Agile Development Methodology (Scrum)
The project follows the Scrum framework, which decomposes the system into manageable functional increments. This approach allows for rapid prototyping of the e-commerce frontend in early sprints followed by complex inventory logic implementation in later sprints.

### 3.2.1 Scrum Roles
To maintain accountability and focus, the following Scrum roles were adopted in the context of an individual developer:
- **Product Owner:** Responsible for defining the Product Vision and prioritizing the Product Backlog.
- **Scrum Master:** Responsible for maintaining the project timeline and resolving technical blockers (e.g., CORS and validation issues).
- **Development Team:** Implementing the backend (Spring Boot), frontend (Next.js), and database (MySQL) components.

### 3.2.2 Scrum Artifacts
- **Product Backlog:** A comprehensive list of all desired features expressed as user stories.
- **Sprint Backlog:** The subset of user stories selected for implementation in a specific 2-week cycle.

### 3.2.3 Scrum Events
- **Sprint Planning:** Defining the scope and technical requirements of the upcoming sprint.
- **Sprint Reviews:** Validating the functional increment against the initial requirements.
- **Sprint Retrospectives:** Identifying technical hurdles and refining the implementation approach for the next sprint.

## 3.3 Product Backlog and User Stories
The foundation of the project planning is the Product Backlog, prioritized by business value:

| ID | User Story | Priority | Status |
|---|---|---|---|
| **PB1** | As a user, I want to register/login for secure access. | High | ✅ Completed |
| **PB2** | As a customer, I want to checkout products to place orders. | High | ✅ Completed |
| **PB3** | As an admin, I want to upload inventory via CSV for bulk management. | Medium | ✅ Completed |
| **PB4** | As an admin, I want stock deducted using **FEFO** logic to minimize expiry risk. | High | ✅ Completed |
| **PB5** | As an admin, I want to log spoilage and damage for stock accuracy. | Medium | ✅ Completed |
| **PB6** | As an admin, I want predictive restocking alerts to plan inventory proactively. | Low | ✅ Completed |

## 3.4 System Requirements
### 3.4.1 Functional Requirements
- Secure JWT-based authentication.
- Real-time stock observation and batch tracking.
- Expiry-dependent (FEFO) stock deduction logic.
- Automated predictive restocking suggested based on sales trends.

### 3.4.2 Non-Functional Requirements
- **Security:** All passwords must be hashed (BCrypt) and API endpoints secured.
- **Performance:** Checkout operations must yield immediate results without transactional lag.
- **Integrity:** The system must maintain ACID compliance during inventory state changes.

## 3.5 Sprint Planning and Timeline
The project timeline is organized into 12 sprints, ensuring a logical progression from core e-commerce features to advanced inventory intelligence.

[Insert Gantt Chart Figure Here]

| Phase | Sprint | Deliverable |
|---|---|---|
| **FYP1** | S1-S2 | Identity: Registration, Login, Profile Management |
| | S3-S4 | Shopping: Product Listing, Cart, Basic Checkout |
| | S5-S6 | Onboarding: CSV Parser & Bulk Inventory Creation |
| **FYP2** | S7-S8 | Expiry Control: FEFO Deduction Algorithm |
| | S9-S10 | Audit Control: Spoilage Tracking & Movement Logs |
| | S11-S12 | Forecast: Predictive Restocking Analytics |

## 3.6 Verification and Validation Plan
Verification activities are conducted to ensure that each developed module meets both functional and non-functional requirements. Testing is carried out incrementally at the end of each sprint, following Agile Scrum practices, utilizing black-box, white-box, and integration testing approaches as appropriate.

### 3.6.1 Authentication
- **Inputs to Test:** Valid credentials, invalid credentials, and duplicate registration attempts.
- **Expected Outputs:** Successful login with JWT token issuance, rejection of invalid entries, and enforcement of unique user creation.
- **Verification Method:** Unit tests for password hashing (BCrypt) and JWT token generation integrity.

### 3.6.2 Customer Checkout
- **Inputs to Test:** Items in cart with sufficient stock, items exceeding stock, empty carts, and cancelled orders.
- **Expected Outputs:** Successful order placement with correct stock deduction, error messages for insufficient stock, and accurate order history recording.
- **Verification Method:** Integration tests between the frontend cart and backend checkout API; transactional testing to confirm database state consistency.

### 3.6.3 Bulk Inventory Upload
- **Inputs to Test:** Valid CSV files, missing fields, incorrect data types, and large datasets (500+ SKUs).
- **Expected Outputs:** Successful insertion for valid rows, row-level error reporting for invalid entries, and system stability during high-volume uploads.
- **Verification Method:** Algorithmic validation of the CSV parsing function and price computation logic.

### 3.6.4 FEFO Deduction Logic
- **Inputs to Test:** Cart items spanning multiple batches with varying expiry dates.
- **Expected Outputs:** System automatically deducts from the earliest expiry batch first; correct batch IDs are recorded in the transaction history.
- **Verification Method:** SQL-level database audits to confirm batch-level quantity updates.

### 3.6.5 Spoilage Logging
- **Inputs to Test:** Admin logs for expired stock, damaged stock, and attempts at entering negative/invalid quantities.
- **Expected Outputs:** Spoilage log entry recorded, stock reduced correctly in real-time, and rejection of invalid quantities.
- **Verification Method:** Cross-verification of spoilage log entries against the `stock_movements` audit table.

### 3.6.6 Predictive Restocking
- **Inputs to Test:** Historical sales datasets with varying demand patterns and perishability constraints.
- **Expected Outputs:** System generates reorder point alerts when stock falls below the computed threshold; suggested restocking quantity aligns with the adaptive forecast.
- **Verification Method:** Algorithmic verification using test datasets; manual comparison of predicted vs. expected reorder points.

### 3.6.7 Expired Batch Cleanup
- **Inputs to Test:** Admin triggers the "Cleanup Expired" function for products with several past-due batches.
- **Expected Outputs:** All expired batches are automatically deactivated and moved to the spoilage log; the available stock count is updated instantly.
- **Verification Method:** Database audit of the `is_active` flag for batches and creation of corresponding `spoilage_log` entries.

### 3.6.8 Inventory Reporting & Export
- **Inputs to Test:** Admin requests a Stock Report export in CSV or PDF format.
- **Expected Outputs:** A correctly formatted file is generated containing live stock levels, low-stock warnings, and recent spoilage totals.
- **Verification Method:** Visual inspection of the exported file content against the live MySQL database state.

## 3.7 Summary
Chapter 3 established the methodological foundation for the project. By breaking down the complex requirements into a 12-sprint Product Backlog and defining a rigorous, module-by-module verification plan, the project maintained a clear and manageable path from planning to technical completion.
