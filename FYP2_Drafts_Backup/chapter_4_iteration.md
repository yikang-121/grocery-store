# CHAPTER 4 – Iterative Development & Sprint Execution

This chapter documents the iterative implementation of the system across six sprints (FYP1). Each sprint represents a functional product increment, evaluated against the "Definition of Done" established in the planning phase.

## 4.1 Development Environment & Setup
To support the iterative development, the following environment was established:
- **IDEs:** IntelliJ IDEA (Backend), VS Code/Cursor (Frontend).
- **Runtime:** Node.js 18+, OpenJDK 17.
- **Datasets:** Sample grocery data sourced from Kaggle (Amazon Grocery Dataset) for realistic product simulation.

## 4.2 Sprint 1 & 2: User Authentication & Role Assignment
### 4.2.1 Sprint Goal & Planning
The objective was to implement secure access control (User Story PB1). This involved setting up the MySQL user schema and the Spring Security filter chain.

### 4.2.2 Sprint Execution
The team implemented a stateless JWT authentication system. 
[Insert Figures 4.2.1.1 to 4.2.1.9 - Login/Registration UI]

### 4.2.3 Sprint Review (Verification)
The module successfully hashes passwords using BCrypt and issues unique JWT tokens. It met the DoD by ensuring that unauthorized users cannot access admin dashboards.

### 4.2.4 Sprint Retrospective
A significant challenge was managing "Silent Logout" where tokens expired without user notification. The solution involved implementing an Axios interceptor on the frontend to catch 401 errors and force a clean redirection to the login portal.

## 4.3 Sprint 3 & 4: Checkout Module & Cart Setup
### 4.3.1 Sprint Goal & Planning
The objective was to enable the core e-commerce shopping experience (User Story PB2).

### 4.3.2 Sprint Execution
The team developed the multi-item cart system and the checkout overview page.
[Insert Figures 4.2.2.1 to 4.2.2.9 - Product/Cart/Checkout UI]

### 4.3.3 Sprint Review
The system successfully validates stock quantities during the cart review phase, preventing users from checking out more items than are physically available.

### 4.3.4 Sprint Retrospective
During integration, the team encountered **CORS (Cross-Origin Resource Sharing) Errors** when the frontend tried to communicate with the backend. This was resolved by implementing a global `WebMvcConfigurer` in Spring Boot to explicitly allow the local development origin.

## 4.4 Sprint 5 & 6: Bulk Upload & Admin Dashboard
### 4.4.1 Sprint Goal & Planning
The objective was to provide administrators with bulk management tools (User Story PB3).

### 4.4.2 Sprint Execution
The team implemented a CSV parsing engine using the OpenCSV library.
[Insert Figures 5.2.3.1 to 5.2.3.4 - Admin Dashboard & CSV Upload]

### 4.4.3 Sprint Review
Administrators can now upload hundreds of products in seconds. The system calculates selling prices automatically based on profit margin inputs.

### 4.4.4 Sprint Retrospective
Initial prototypes would crash if a CSV contained a single malformed row (e.g., missing price). The team adapted the logic mid-sprint to implement **Row-Level Validation**, allowing valid items to pass while logging specific errors for malformed rows.
