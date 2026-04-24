# FYP2 Report – Full Subtopic Breakdown (UTAR 7-Chapter Format)
**Project:** E-Commerce Website and Inventory System  
**Student:** Yong Yi Kang (23ACB01506) | UTAR | Development-Based Project  
**Tech Stack:** Spring Boot (Java) · Next.js · MySQL  
**Methodology:** Agile Scrum (12 Sprints)

---

## 📌 Suggested Writing Order

| Priority | Chapter/Section | Reason |
|---|---|---|
| 1 | Ch 5.4 – System Operation (screenshots) | Most content, most marks |
| 2 | Ch 6.2 – Testing Setup and Results | Evidence of correctness |
| 3 | Ch 4 – System Design | Required for technical depth |
| 4 | Ch 3 – Methodology | Update from FYP1 with new diagrams |
| 5 | Ch 2 – Literature Review | Reorganize FYP1 content to new format |
| 6 | Ch 1 – Introduction | Write last, easy once everything is done |
| 7 | Ch 7 – Conclusion | Wrap-up, depends on everything above |

---

---

## CHAPTER 1 – Introduction *(5–10 pages)*

> Briefly explain the project, what gap it fills, and what was built in FYP2.

### 1.1 Problem Statement and Motivation
- Grocery e-commerce platforms lack expiry-aware stock management
- **4 problems (from FYP1 — restate them):**
  1. Lack of Expiry-Aware FEFO Integration
  2. Absence of Spoilage or Damage Logging
  3. Lack of Predictive Restocking Mechanisms
  4. Lack of Bulk Inventory Update Support
- Motivation: SME grocery retailers cannot afford costly enterprise systems (Walmart, RedMart)
- Your system provides affordable, scalable, SME-friendly alternatives

### 1.2 Objectives
> State all 4 objectives from FYP1 — now fully achieved in FYP2.
1. Develop expiry-aware FEFO deduction system ✅
2. Integrate real-time spoilage and damage logging ✅
3. Design bulk inventory CSV upload ✅
4. Implement predictive restocking algorithm ✅

### 1.3 Project Scope
- Single-vendor web-based grocery e-commerce system
- Users: Customers + Administrators
- **In scope:** FEFO deduction, spoilage logging, predictive restocking, bulk upload, checkout, authentication
- **Out of scope:** logistics, payment gateway (real), multi-vendor support, mobile app

### 1.4 Contributions
List the novel contributions your system makes:
- First system to integrate FEFO deduction at the checkout level for SME grocers
- Automated spoilage/waste logging with stock correction
- Lightweight ML-based predictive restocking without enterprise infrastructure
- Bulk CSV upload with row-level validation

### 1.5 Report Organization
Brief paragraph or table describing what each chapter covers:
- Chapter 2: Literature Review (technologies used + competing systems)
- Chapter 3: System Methodology (Agile Scrum + diagrams)
- Chapter 4: System Design (architecture, components, database)
- Chapter 5: System Implementation (setup, screenshots of all modules)
- Chapter 6: System Evaluation (test cases, results, objective achievement)
- Chapter 7: Conclusion and Recommendations

---

---

## CHAPTER 2 – Literature Review *(5–30 pages)*

> Reorganized from FYP1. Two main sections: **Technologies** and **Existing Systems**.

---

### 2.1 Review of the Technologies

#### 2.1.1 Hardware Platform
- Development machine: Acer Nitro 5 AN515-45
- Specs: AMD Ryzen 5 5600H, 16GB DDR5 RAM, 512GB NVMe SSD
- Why sufficient: supports concurrent backend+frontend dev, local DB hosting, testing

#### 2.1.2 Firmware / OS & Frameworks
- **OS:** Windows 11 (development environment)
- **Backend Framework:** Spring Boot (Java) — explain why chosen (REST API support, security, layered architecture)
- **Frontend Framework:** Next.js (React) — explain why (SSR, dynamic routing, API integration)
- **Development Tools:** IntelliJ IDEA, VS Code/Cursor, MySQL Workbench, Git/GitHub
- Compare with alternatives (e.g., Django vs Spring Boot, Vue.js vs Next.js)

#### 2.1.3 Database
- **MySQL** — relational database, supports ACID transactions
- Why MySQL over NoSQL: structured relational data (orders, batches, users, products)
- Key tables: `users`, `products`, `inventory_batches`, `orders`, `order_items`, `spoilage_logs`, `stock_movements`, `purchase_orders`
- Mention JPA/Hibernate for ORM mapping in Spring Boot

#### 2.1.4 Programming Language
- **Java** (Spring Boot backend) — type-safe, enterprise-grade
- **TypeScript / JavaScript** (Next.js frontend) — dynamic typing, component-based
- **SQL** (MySQL queries)
- **CSV** (OpenCSV library for bulk upload parsing)
- Supporting: **JWT** (JSON Web Tokens) for stateless authentication

#### 2.1.5 Algorithm
> This is the most important sub-section for FYP2 — explain your novel algorithms.

**FEFO (First Expired, First Out) Algorithm:**
- What is FEFO vs FIFO
- How it works: sort inventory batches by `expiry_date ASC` → deduct from earliest expiry first
- How it's implemented in Spring Boot checkout service
- Reference literature supporting FEFO for perishables

**Predictive Restocking Algorithm:**
- Based on: average daily sales over the past 7–14 days
- Formula: `Restock Threshold = Average Daily Sales × Lead Time Days`
- When `current_stock < threshold` → generate Purchase Order alert
- Compare with ML approaches (LSTM, ARIMA) — explain why simpler model chosen for SME context
- Reference: DataPilot study on predictive inventory management

**Spoilage Detection Trigger:**
- Admin manually logs spoilage → system deducts stock + records audit in `stock_movements` table
- Prevents ghost stock (items showing available but are actually expired/damaged)

#### 2.1.6 Summary of the Technologies Review
- Summary table comparing technology choices

| Technology | Choice | Alternative Considered | Reason for Choice |
|---|---|---|---|
| Backend | Spring Boot | Django, Node.js | Java ecosystem, security, REST support |
| Frontend | Next.js | Vue.js, Angular | SSR, React ecosystem, routing |
| Database | MySQL | MongoDB, PostgreSQL | Relational data, ACID transactions |
| Auth | JWT | Session-based | Stateless, scalable |
| CSV Parsing | OpenCSV | Manual parsing | Robust, handles edge cases |

---

### 2.2 Review of Existing Systems / Applications

#### 2.2.1 Existing System A – Walmart
- Real-time inventory tracking, AI-driven restocking
- Perishable product tagging + product substitution
- **Gaps:** No FEFO at checkout, no spoilage logging, no bulk upload for SMEs, not scalable to small businesses

#### 2.2.2 Existing System B – Lotus's
- Basic perishable product categorization (front-end labels only)
- No real-time stock visibility, no expiry dates at checkout
- **Gaps:** No FEFO deduction, no spoilage/damage logging, no predictive restocking, no bulk upload

#### 2.2.3 Existing System C – RedMart by Lazada
- Backend batch tracking, food recall compliance
- Shows "Only XX stock left"
- **Gaps:** No FEFO at customer checkout, no spoilage logging, no predictive restocking, no bulk upload

#### 2.2.4 Existing System D – Village Grocer (Bites Shop)
- Digital picker system, inventory visibility at branch level
- Perishable tagging + product substitution
- **Gaps:** Most backend processes manual, no FEFO, no predictive restocking, no bulk upload

#### 2.2.5 Existing System E – Jaya Grocer (GrabMart Integration)
- Syncs catalogue with GrabMart to reduce manual updates
- Automates order fulfilment accuracy
- **Gaps:** No product substitution, no FEFO deduction, no spoilage handling, no bulk upload

#### 2.2.6 Summary of the Existing Systems
Include **Comparison Table** (same as FYP1 Table 2.1, but now with "My Project" column all ticked):

| Feature | Walmart | Lotus's | RedMart | Village Grocer | Jaya Grocer | **This System** |
|---|---|---|---|---|---|---|
| Real-Time Inventory Tracking | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Expiry-Aware FEFO Deduction | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Spoilage/Waste Logging | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Predictive Restocking | ✅ (AI) | ❌ | ❌ | ❌ | ❌ | **✅** |
| Bulk Inventory Upload | ❌ | ❌ | ❌ | ❌ | ❌ | **✅** |
| Perishable Product Tagging | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

---

## CHAPTER 3 – System Methodology / Approach

> Explain Agile Scrum + all system diagrams.

### 3.1 System Design Diagram

#### 3.1.1 System Architecture Diagram
- **Client-Server Architecture**
- Client: Next.js frontend (browser)
  - Product listings, cart, checkout, admin dashboard
  - Sends HTTP requests via Axios
- Server: Spring Boot backend
  - Controllers (API endpoints), Services (business logic), Repository (JPA/DB)
  - Handles JWT auth, FEFO deduction, spoilage logging, predictive restocking
- Database: MySQL
- Explain data flow: Client → HTTP → Spring Boot → MySQL → JSON response → Client

#### 3.1.2 Use Case Diagram and Description
- **Customer use cases:** Register, Login, Browse Products, Add to Cart, Checkout, View Orders, Cancel Order, Manage Wishlist
- **Admin use cases:** Login, Manage Products, Upload Inventory (CSV), View Stock, Log Spoilage, View Restock Alerts, Manage Purchase Orders, View Reports
- Include actual Use Case Diagram image
- Table: describe each use case (actor, precondition, flow, postcondition)

#### 3.1.3 Activity Diagrams
Include all activity diagrams (from FYP1 + new ones for FYP2):

**From FYP1:**
1. User Registration Activity Diagram
2. User Login with Role Check Activity Diagram
3. Add to Cart and Stock Validation Activity Diagram
4. Cart Review and Stock Issues Activity Diagram
5. Checkout Authentication Activity Diagram
6. Address Management Activity Diagram
7. Payment Process Activity Diagram
8. Order Completion Activity Diagram
9. Order Cancellation Activity Diagram
10. Product Management Activity Diagram
11. Inventory Management Activity Diagram
12. Order Management Activity Diagram
13. Bulk Upload Activity Diagram

**NEW for FYP2:**
14. **FEFO Deduction Activity Diagram** ← *Must draw this*
15. **Spoilage Logging Activity Diagram** ← *Must draw this*
16. **Predictive Restocking Activity Diagram** ← *Must draw this*

> 💡 Also mention **Agile Scrum methodology** here:
> - Scrum roles (Product Owner, Scrum Master, Dev Team — all you)
> - Sprint cycle: Planning → Development → Testing → Review → Retrospective
> - Sprint table: Sprints 1–12, all now Completed
> - Updated Gantt Chart (all green)

---

---

## CHAPTER 4 – System Design *(5–30 pages)*

> Deep-dive into how the system is structured technically — enough for someone to rebuild it.

### 4.1 System Block Diagram
- Top-level block diagram showing: Frontend ↔ Backend API ↔ Database
- Sub-blocks within backend: Auth Module, Product Module, Cart Module, Order/Checkout Module, Bulk Upload Module, FEFO Module, Spoilage Module, Restock Module
- Explain each block's responsibility

### 4.2 System Components Specifications

#### Frontend Components (Next.js)
| Component | Description |
|---|---|
| `HomePage` | Product listings, search, categories |
| `ProductDetailPage` | Item description, add to cart |
| `CartPage` | Cart items, stock validation display |
| `CheckoutPage` | Address, payment method, order summary |
| `OrderPage` | Order history, cancellation form |
| `AdminDashboard` | KPIs: stock, orders, revenue |
| `RestockPage` | CSV bulk upload + restock alerts |
| `SpoilageLogPage` | Spoilage form, spoilage history |
| `AccountingPage` | Revenue charts, weekly performance |
| `WishlistPage` | Saved products |

#### Backend Modules (Spring Boot)
| Module | Controller | Service | Key Method |
|---|---|---|---|
| Authentication | `UserController` | `UserService` | `login()`, `register()` |
| Product | `ProductController` | `ProductService` | `getAllProducts()`, `updateProduct()` |
| Cart | `CartController` | `CartService` | `addToCart()`, `validateStock()` |
| Checkout/Order | `OrderController` | `OrderService` | `placeOrder()`, `cancelOrder()` |
| Bulk Upload | `InventoryController` | `InventoryService` | `uploadCSV()`, `validateRow()` |
| FEFO | (within OrderService) | `StockMovementService` | `deductFEFO()` |
| Spoilage | `SpoilageController` | `SpoilageService` | `logSpoilage()` |
| Restocking | `PurchaseOrderController` | `RestockService` | `generateRestockAlert()` |

### 4.3 Database Design (ERD)
- Show the full updated ERD (include new tables added in FYP2)
- Describe key tables:

| Table | Key Columns | Purpose |
|---|---|---|
| `users` | id, name, email, password_hash, role | Authentication + role management |
| `products` | id, name, category, price, stock_quantity | Product catalogue |
| `inventory_batches` | id, product_id, batch_no, quantity, expiry_date | FEFO batch tracking |
| `orders` | id, user_id, status, total_price, created_at | Customer orders |
| `order_items` | id, order_id, product_id, batch_id, quantity | Line items + FEFO tracking |
| `spoilage_logs` | id, product_id, batch_id, quantity, reason, logged_at | Spoilage audit trail |
| `stock_movements` | id, product_id, type, quantity, reference_id, created_at | Full stock audit log |
| `purchase_orders` | id, product_id, quantity, status, created_at | Restock purchase orders |
| `vouchers` / `user_vouchers` | id, code, discount, user_id | Discount/voucher system |
| `addresses` | id, user_id, street, city, state | Customer delivery addresses |
- Provide CREATE TABLE SQL or at least column-level desc

### 4.4 System Components Interaction / Operations
Describe the **end-to-end data flow** for each key operation:

#### 4.4.1 Customer Checkout with FEFO Deduction
1. Customer clicks "Place Order"
2. Frontend sends `POST /api/orders` with cart items
3. Backend `OrderService.placeOrder()`:
   - Validates stock availability
   - Queries `inventory_batches` sorted by `expiry_date ASC`
   - Deducts quantity from earliest expiry batch first (FEFO)
   - If batch exhausted, spills to next batch
   - Saves `order_items` with `batch_id` reference
   - Inserts `stock_movements` records for audit
4. Returns order confirmation JSON to frontend

#### 4.4.2 Admin Spoilage Logging
1. Admin fills spoilage form (product, batch, qty, reason)
2. Frontend sends `POST /api/spoilage`
3. Backend `SpoilageService.logSpoilage()`:
   - Validates qty <= batch available quantity
   - Deducts from `inventory_batches`
   - Inserts record into `spoilage_logs`
   - Inserts record into `stock_movements` (type = SPOILAGE)
4. Returns success + updated stock level

#### 4.4.3 Predictive Restocking Alert Generation
1. Scheduled task (or triggered manually) runs `RestockService.checkRestockNeeds()`
2. For each product:
   - Calculate `avgDailySales` = total sales last 14 days / 14
   - Calculate `restockThreshold` = avgDailySales × leadTimeDays
   - If `product.stockQuantity < restockThreshold`:
     - Create `PurchaseOrder` record
3. Admin dashboard fetches and displays alerts

#### 4.4.4 Bulk CSV Upload
1. Admin selects CSV file → Frontend sends `POST /api/inventory/upload`
2. Backend `InventoryService.uploadCSV()`:
   - Parse CSV rows with OpenCSV
   - Validate each row (required fields, data types, expiry date format)
   - Valid rows → insert into `inventory_batches`
   - Invalid rows → return row-level error report
3. Frontend displays success count + error rows

---

---

## CHAPTER 5 – System Implementation *(with Screenshots)*

> Show the actual running system. This is your **evidence** chapter.

### 5.1 Hardware Setup
- Laptop: Acer Nitro 5 AN515-45 (AMD Ryzen 5 5600H, 16GB DDR5 RAM, 512GB SSD)
- No additional hardware required — web-based system

### 5.2 Software Setup
- **Backend:** IntelliJ IDEA, Java 17+, Maven, Spring Boot 3.x
- **Frontend:** VS Code/Cursor, Node.js 18+, npm, Next.js 14
- **Database:** MySQL 8.x, MySQL Workbench
- **Version Control:** Git + GitHub
- **API Testing:** Postman (for backend endpoint verification)
- **CSV Library:** OpenCSV (Maven dependency)

### 5.3 Settings and Configuration
- Spring Boot `application.properties`:
  - MySQL connection URL, username, password
  - JWT secret and expiry time
  - CORS configuration (allowed origins: `http://localhost:3000`)
  - File upload size limits
- Next.js `.env.local`:
  - `NEXT_PUBLIC_API_URL = http://localhost:8080`
- MySQL schema initialization (Flyway or manual DDL scripts)
- How to run: `mvn spring-boot:run` (backend) + `npm run dev` (frontend)

### 5.4 System Operation *(with Screenshots)*

#### 5.4.1 Authentication Module
- Screenshot: Home Page
- Screenshot: Login Page (valid login → redirect to home)
- Screenshot: Login Page (invalid credentials → error message)
- Screenshot: Registration Page (successful with valid input)
- Screenshot: Registration Page (duplicate email → error)
- Screenshot: User Profile Page

#### 5.4.2 Customer Checkout Module
- Screenshot: Product Listing Page
- Screenshot: Product Detail Page
- Screenshot: Cart Page (normal state + stock error state)
- Screenshot: Checkout Page (order overview)
- Screenshot: Checkout Page (address + payment method)
- Screenshot: Order Confirmation Page
- Screenshot: Order History Page
- Screenshot: Order Cancellation Form

#### 5.4.3 Bulk Inventory Upload Module
- Screenshot: Admin Restock Page (CSV upload area)
- Screenshot: Successful bulk upload (with success count)
- Screenshot: Upload with errors (row-level error report shown)
- Include: sample valid CSV format

#### 5.4.4 FEFO Deduction Module *(NEW — most important)*
- Screenshot: Admin Inventory Batches view (sorted by expiry date)
- Screenshot: Before checkout — batch stock levels
- Screenshot: After checkout — earliest expiry batch deducted first
- Screenshot: `order_items` table showing `batch_id` reference
- Screenshot: `stock_movements` table showing FEFO deduction records
- Narrative: explain step-by-step how FEFO worked in the demo order

#### 5.4.5 Spoilage & Damage Logging Module *(NEW)*
- Screenshot: Admin Spoilage Log form
- Screenshot: Spoilage recorded — stock reduced correctly
- Screenshot: Spoilage History/Report page
- Screenshot: `spoilage_logs` table in DB
- Screenshot: `stock_movements` showing SPOILAGE type entry

#### 5.4.6 Predictive Restocking Module *(NEW)*
- Screenshot: Admin Dashboard showing restock alerts panel
- Screenshot: Low-stock items flagged with recommended restock qty
- Screenshot: Auto-generated Purchase Order
- Screenshot: Purchase Order list in admin panel
- Screenshot: Weekly/daily sales chart used for trend analysis
- Narrative: explain threshold calculation with a real example product

### 5.5 Implementation Issues and Challenges

| Issue | Sprint | Solution |
|---|---|---|
| CSV validation failures on large files | Sprint 5–6 | Row-level validation + error reporting |
| CORS errors between frontend and backend | Sprint 2 | CORS config in Spring Boot |
| FEFO batch spill-over logic edge case | Sprint 7–8 | Iterative batch deduction loop in service |
| JWT token expiry causing silent logout | Sprint 1 | Implemented token refresh + frontend interceptor |
| Predictive threshold miscalculation on zero-sales days | Sprint 11 | Added null-safe average with minimum floor value |
| Stock sync issues between order placement and spoilage | Sprint 9 | Database transactions (Spring @Transactional) |

### 5.6 Concluding Remark
- All 4 objectives successfully implemented and demonstrated
- System is fully functional across all 6 modules
- Ready for evaluation and testing

---

---

## CHAPTER 6 – System Evaluation and Discussion

### 6.1 System Testing and Performance Metrics
- **Testing Approach:** Black-box testing (functional correctness), White-box testing (code-level), Integration testing (frontend ↔ backend ↔ DB)
- **Testing Types Used:**
  - Unit Testing (Spring Boot @WebMvcTest / JUnit for service methods)
  - Integration Testing (checkout API → DB update verification)
  - Manual/Functional Testing (UI walkthrough per module)
- **Metrics:** pass/fail per test case, stock accuracy after FEFO deduction

### 6.2 Testing Setup and Results

#### Authentication Module Testing
| Test Case | Input | Expected Output | Result |
|---|---|---|---|
| Valid login | Correct email + password | JWT token returned, redirect to home | ✅ Pass |
| Invalid login | Wrong password | Error message displayed | ✅ Pass |
| Duplicate registration | Existing email | "Email already exists" error | ✅ Pass |
| Password mismatch | Different passwords | Validation error shown | ✅ Pass |

#### Checkout Module Testing
| Test Case | Input | Expected Output | Result |
|---|---|---|---|
| Sufficient stock | Cart within stock limit | Order placed, stock deducted | ✅ Pass |
| Insufficient stock | Item qty > available | Cart shows stock error | ✅ Pass |
| Empty cart checkout | No items in cart | Checkout blocked | ✅ Pass |
| Order cancellation | Valid pending order | Status updated to CANCELLED | ✅ Pass |

#### FEFO Deduction Testing *(Key test)*
| Test Case | Input | Expected Output | Result |
|---|---|---|---|
| Single batch deduction | 1 batch, order qty < batch qty | Deducts from that batch | ✅ Pass |
| Multi-batch deduction | 2 batches, qty spans both | Deducts earliest expiry first, spills to next | ✅ Pass |
| Batch exact exhaustion | Order qty = batch qty | Batch qty goes to 0, no negative stock | ✅ Pass |
| Correct batch_id recorded | Any FEFO order | order_items.batch_id = correct earliest batch | ✅ Pass |

#### Spoilage Logging Testing
| Test Case | Input | Expected Output | Result |
|---|---|---|---|
| Log expired items | Valid qty + reason | Spoilage log created, stock reduced | ✅ Pass |
| Log damaged items | Damaged qty < batch qty | Stock reduced correctly | ✅ Pass |
| Invalid over-quantity | Qty > available stock | Rejection with error message | ✅ Pass |
| Audit trail verification | Any spoilage log | stock_movements record created | ✅ Pass |

#### Predictive Restocking Testing
| Test Case | Input | Expected Output | Result |
|---|---|---|---|
| Stock below threshold | Low stock after high sales | Restock alert generated | ✅ Pass |
| Stock above threshold | Adequate stock | No alert generated | ✅ Pass |
| Purchase order creation | Alert triggered | PO record created in DB | ✅ Pass |
| Zero sales edge case | Product with no recent sales | No crash, handled gracefully | ✅ Pass |

#### Bulk Upload Testing
| Test Case | Input | Expected Output | Result |
|---|---|---|---|
| Valid CSV | Correct format, all fields | All rows inserted successfully | ✅ Pass |
| Missing required field | Row with blank product_id | Row-level error reported, others inserted | ✅ Pass |
| Invalid data type | Non-numeric quantity | Error reported for that row | ✅ Pass |
| Large dataset | 500+ rows CSV | No crash, all rows processed | ✅ Pass |

### 6.3 Project Challenges
- Implementing FEFO correctly when a single order spans multiple batches
- Ensuring database consistency between spoilage deductions and stock movements
- Calibrating the predictive restocking threshold to avoid false alerts
- Managing JWT token lifecycle in a stateless Spring Boot + Next.js setup

### 6.4 Objectives Evaluation

| Objective | Target | Achieved? | Evidence |
|---|---|---|---|
| 1. FEFO deduction system | Deduct from earliest expiry batch first | ✅ Yes | Section 5.4.4 + FEFO test results |
| 2. Spoilage/damage logging | Admin logs, auto stock deduction | ✅ Yes | Section 5.4.5 + Spoilage test results |
| 3. Bulk CSV upload | CSV upload with row-level validation | ✅ Yes | Section 5.4.3 + Bulk upload test results |
| 4. Predictive restocking | Sales-trend alerts + purchase orders | ✅ Yes | Section 5.4.6 + Restocking test results |

### 6.5 Concluding Remark
- All 4 objectives achieved and validated through testing
- System closes all 4 gaps identified in Chapter 2 literature review
- Demonstrated readiness for SME grocery deployment

---

---

## CHAPTER 7 – Conclusion and Recommendation *(2–5 pages)*

### 7.1 Conclusion
- Summarize what was built across FYP1 + FYP2
- FYP1 delivered: Authentication, Checkout, Bulk Upload (Sprints 1–6)
- FYP2 delivered: FEFO Deduction, Spoilage Logging, Predictive Restocking (Sprints 7–12)
- All 4 objectives met
- System provides a practical, cost-effective, scalable inventory solution for SME grocery retailers
- Closes gaps identified in existing platforms (Walmart, Lotus's, RedMart, Village Grocer, Jaya Grocer)

### 7.2 Recommendation (Future Work)
- **Multi-vendor support:** Extend system to support multiple grocery vendors on one platform
- **Real payment gateway:** Integrate Stripe / FPX / GrabPay for actual transactions
- **Mobile app:** React Native or Flutter version for mobile shoppers
- **Advanced forecasting:** Replace basic sales-trend model with ARIMA or LSTM neural network for more accurate demand prediction
- **Customer-facing expiry display:** Show expiry dates to customers for transparency and trust
- **Near-expiry dynamic discounting:** Auto-apply discounts on products approaching expiry date (price optimization)
- **Cloud deployment:** Deploy on AWS/GCP with CI/CD pipeline for production readiness

---

*End of FYP2 Report Subtopic Breakdown*
