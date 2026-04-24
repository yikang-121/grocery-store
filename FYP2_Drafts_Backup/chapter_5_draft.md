# Chapter 5: System Implementation

This chapter details the deployment and operational aspects of the E-Commerce Website and Inventory System. It covers the hardware and software setups used during development, system configurations, and a comprehensive walkthrough of the system’s operations accompanied by screenshots. Furthermore, the challenges encountered during Sprints 1 to 12 are documented along with their respective solutions.

## 5.1 Hardware Setup
The development of both the frontend and backend components, as well as the local hosting of the database, was carried out on a personal laptop. The hardware specifications are as follows:
*   **Model:** Acer Nitro 5 AN515-45
*   **Processor:** AMD Ryzen 5 5600H
*   **Memory (RAM):** 16GB DDR5
*   **Storage:** 512GB NVMe SSD
This hardware configuration provided sufficient processing power and memory to seamlessly run the Next.js development server, the Spring Boot application, and the MySQL database concurrently without performance degradation.

## 5.2 Software Setup
The system follows a modern full-stack architecture. The primary software tools and frameworks utilized include:
*   **Backend:** Java 17+, Spring Boot 3.x, Maven (Dependancy Management)
*   **Frontend:** Node.js 18+, npm, Next.js 14, React
*   **Database:** MySQL 8.x
*   **Integrated Development Environments (IDEs):** IntelliJ IDEA (for Backend), Visual Studio Code / Cursor (for Frontend)
*   **Database Management:** MySQL Workbench
*   **Version Control:** Git and GitHub

## 5.3 Setting and Configuration
To ensure smooth communication between the decoupled frontend and backend, and to secure the application, several configurations were established:
*   **Backend (`application.properties`):** Configured database connection strings (MySQL URL, username, and password). Defined JWT secret keys and token expiration times for stateless authentication. Configured Cross-Origin Resource Sharing (CORS) to allow requests exclusively from the frontend domain (`http://localhost:3000`).
*   **Frontend (`.env.local`):** Defined environment variables such as `NEXT_PUBLIC_API_URL` pointing to the backend server (`http://localhost:8080`) to centralize API request routing.
*   **Execution Commands:** The backend is initialized using `mvn spring-boot:run`, while the frontend server is started using `npm run dev`.

## 5.4 System Operation
This section demonstrates the core functionalities of the system. While the Authentication, Checkout, and Bulk Upload modules were established in earlier phases, the focus here includes the newly implemented inventory control functionalities: FEFO deduction, spoilage logging, and predictive restocking.

### 5.4.1 Authentication Module
The authentication module secures the platform, distinguishing between customer and administrator roles.
> **[Insert Screenshot Here: Home Page]**
> *Figure 5.4.1.1: The landing page of the E-Commerce platform.*

> **[Insert Screenshot Here: Login Page (Successful)]**
> *Figure 5.4.1.2: A user successfully logging into the system.*

> **[Insert Screenshot Here: Registration Page]**
> *Figure 5.4.1.3: User registration form enforcing unique email constraints.*

### 5.4.2 Customer Checkout Module
Customers can browse products, add them to their cart, and proceed to checkout. The system validates stock availability before confirming the order.
> **[Insert Screenshot Here: Product Listing Page]**
> *Figure 5.4.2.1: The product catalogue available for customers.*

> **[Insert Screenshot Here: Cart Page]**
> *Figure 5.4.2.2: The shopping cart displaying selected items and total price.*

> **[Insert Screenshot Here: Checkout Page]**
> *Figure 5.4.2.3: The checkout interface for address and payment method entry.*

### 5.4.3 Bulk Inventory Upload Module
Administrators can rapidly update stock levels by uploading CSV files. The system performs row-level validation to reject malformed data while accepting valid entries.
> **[Insert Screenshot Here: CSV Upload Interface]**
> *Figure 5.4.3.1: The bulk upload interface in the admin dashboard.*

> **[Insert Screenshot Here: Upload Result / Error Report]**
> *Figure 5.4.3.2: System response detailing successfully parsed rows and row-level errors.*

### 5.4.4 Product and Batch Management Module
This page allows administrators to manage products and their respective inventory batches. Administrators can add new products by clicking the "Add New Product" button and entering the product information as shown in Figure 5.4.4.2. A summary of all products and their associated batches is displayed in Figure 5.4.4.1. 

Each product can have multiple batches, with the quantity and expiry date clearly shown. Administrators can choose to manually discard specific batches by providing a necessary reason (e.g., "Expired"), as shown in Figure 5.4.4.3. Furthermore, by clicking the "Cleanup Expired" button, the system prompts a confirmation alert. Once confirmed, all expired batches are automatically moved to the spoilage log, as demonstrated in Figure 5.4.4.4.

> **[Insert Screenshot Here: Product & Batch Management Overview]**
> *Figure 5.4.4.1: A summary of the products and their active batches.*

> **[Insert Screenshot Here: Add New Product Form]**
> *Figure 5.4.4.2: The interface for entering new product information.*

> **[Insert Screenshot Here: Spoilage Logging per Batch]**
> *Figure 5.4.4.3: Deleting a batch by selecting a spoilage reason.*

> **[Insert Screenshot Here: Cleanup Expired Confirmation]**
> *Figure 5.4.4.4: The system alert confirming the bulk movement of expired batches to the spoilage log.*

### 5.4.5 Customer Checkout & FEFO Deduction Module
When a customer confirms an order, the system handles the checkout process. Crucially, as part of this process, the backend evaluates the required product quantity against available inventory batches. The system implements FEFO (First Expired, First Out) logic by automatically deducting stock from the batch with the nearest expiry date. If an order quantity exceeds the first batch, the system seamlessly spills the remaining deduction over to the next expiring batch.

> **[Insert Screenshot Here: Checkout Page / Order Confirmation]**
> *Figure 5.4.5.1: The customer completing the checkout process.*

> **[Insert Screenshot Here: Admin Inventory Batches (Before Order)]**
> *Figure 5.4.5.2: The initial quantity of active batches before the customer's order.*

> **[Insert Screenshot Here: Admin Inventory Batches (After Order)]**
> *Figure 5.4.5.3: The updated quantity showing stock was correctly deducted from the earliest expiring batch (FEFO logic success).*

### 5.4.6 Spoilage Logging and Stock Module
To ensure complete transparency and proactive inventory management, the stock auditing functionalities are divided into two distinct views: Stock Movements and Stock Reports.

#### 5.4.6.1 Stock Movement Page
The Stock Movements page acts as a comprehensive audit trail, logging precisely when and why stock quantities change. Administrators can view a high-level summary of total inbound inventory, total outbound inventory, net change, and total events. The chronological table below tracks every event. Using the built-in dropdown filter, administrators can isolate specific movement types; for example, filtering by "Spoilage" instantly generates the historical Spoilage Report.

> **[Insert Screenshot Here: Stock Movements Page - Spoilage Filter]**
> *Figure 5.4.6.1: The exhaustive audit trail filtered specifically to display the Spoilage History Report.*

#### 5.4.6.2 Stock Reports Page
The Stock Reports page provides administrators with an immediate overview of current inventory health. The dashboard calculates the total number of products, while highly emphasizing critical metrics via colored cards such as "Low Stock," "Out of Stock," and "Expiring Soon." A dedicated panel displays "Low Stock Alerts", warning administrators of specific items that are dangerously close to depletion alongside their current quantities.

> **[Insert Screenshot Here: Stock Out & Movement Report Dashboard]**
> *Figure 5.4.6.2: The Stock Reports page highlighting general inventory health and immediate Low Stock Alerts.*

### 5.4.7 Financial Analytics and Predictive Restocking Module
To provide administrators with a unified view of business health and inventory forecasting, the financial reports and predictive restocking mechanics are grouped into this comprehensive analytical module. 

#### 5.4.7.1 Algorithm Evaluation Dashboard (Predictive Restocking)
The predictive restocking portion drives inventory replenishment via an advanced **Algorithm Evaluation Dashboard**. Instead of relying purely on static reorder points, this section runs an Adaptive Restocking Algorithm and compares it side-by-side against a static baseline (ROP/EOQ) for every product. Administrators can click the "Sync Database Metrics" button to forcefully recalculate and update the suggested restock units based on real-time sales velocity and stock movements. 

Crucially, the adaptive algorithm incorporates a "Spoilage Prevented" cap to ensure perishable goods are not over-ordered beyond their expected shelf life. Administrators can expand a "View Internal Metrics" section on each product card to audit the mathematical variables driving the recommendation, including the decay factor, dynamic Z-score, seasonality, and coefficient of variability.

> **[Insert Screenshot Here: Algorithm Evaluation Dashboard Main View]**
> *Figure 5.4.7.1: The restocking interface comparing the baseline static algorithm against the adaptive algorithm.*

> **[Insert Screenshot Here: Expanded Internal Metrics Card]**
> *Figure 5.4.7.2: A detailed breakdown of the adaptive algorithm's internal metrics and spoilage prevention capping.*

#### 5.4.7.2 Financial and Accounting Dashboard
The financial portion of the module consists of an extensive Accounting Dashboard that focuses heavily on revenue tracking, tax compliance, and business health. The dashboard is divided into three primary tabs: Profit & Loss, Invoices, and Purchase Orders.

The **Profit & Loss** tab provides high-level financial summary cards, including Total Revenue, Cost of Goods Sold (COGS), Gross Profit, calculated SST Tax, Spoilage Loss, and Net Profit. Notably, it includes a "Predictive Algorithm Performance" banner that calculates the estimated waste prevented and the forecast accuracy of the system's adaptive algorithm. Administrators can also view financial trends via a "Revenue vs Expenses" bar chart comparing weekly revenue against expenses and spoilage loss.

The **Purchase Orders** tab logs all restocking actions, differentiating between "Smart-Restock Trigger" POs generated by the predictive algorithm and manual "Auto-Generated" POs. It tracks the status of each PO (e.g., Pending Approval, Approved, Received). Finally, the **Invoices** tab allows administrators to look up specific invoice IDs to generate detailed tax calculations and transaction summaries for individual sales.

> **[Insert Screenshot Here: Profit & Loss Metric Cards (with Algorithm Performance)]**
> *Figure 5.4.7.3: High-level financial metrics and predictive algorithm performance tracking.*

> **[Insert Screenshot Here: Revenue vs Expenses Chart]**
> *Figure 5.4.7.4: The weekly financial trend bar chart.*

> **[Insert Screenshot Here: Purchase Orders List]**
> *Figure 5.4.7.5: The purchase order tracking interface, showing statuses of predictive restock triggers.*

> **[Insert Screenshot Here: Invoice Lookup]**
> *Figure 5.4.7.6: Detailed invoice view, calculating subtotal and SST tax.*

## 5.5 Implementation Issues and Challenges
Throughout Sprints 1 to 12, several technical challenges were encountered and resolved. The following table summarizes the most significant issues:

| Issue | Phase | Solution Implemented |
|---|---|---|
| **CORS Errors** | Sprint 2 | The Next.js frontend was blocked from communicating with the Spring Boot backend. Resolved by configuring `@CrossOrigin` and global CORS mappings in Spring Boot to explicitly allow the `localhost:3000` origin. |
| **CSV Validation Failures** | Sprint 5 | Initial bulk uploads failed entirely if a single row was malformed. Re-engineered the parsing logic to implement row-level validation, allowing valid rows to pass while highlighting problematic rows to the admin. |
| **FEFO Batch Spill-Over** | Sprint 7-8 | Deducting stock when an order quantity exceeded the nearest-expiry batch caused negative stock errors. Implemented a recursive/looping deduction algorithm in the `OrderService` to elegantly spill over to subsequent batches. |
| **Stock Sync Discrepancies** | Sprint 9 | Concurrency issues occurred when an order checkout and a spoilage log happened simultaneously. Applied Spring Boot's `@Transactional` annotations to enforce ACID properties during stock manipulation. |
| **Silent JWT Logout** | Sprint 1 | Tokens expiring without user notification caused confusing UI states. Added a frontend Axios interceptor to catch 401 Unauthorized errors and force a clean redirection to the login page. |

## 5.6 Concluding Remark
The implementation phase successfully translated the system design into a working, full-stack application. All core features—ranging from basic authentication and checkout to advanced inventory controls like FEFO deduction, spoilage logging, and predictive alerts—are fully operational. The structured approach to overcoming integration challenges ensures that the system is stable and prepared for systematic evaluation in the subsequent chapter.
