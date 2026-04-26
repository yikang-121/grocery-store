# Chapter 5: System Implementation

This chapter details the deployment and operational aspects of the E-Commerce Website and Inventory System. It covers the hardware and software setups used during development, system configurations, and a comprehensive walkthrough of the system’s operations accompanied by screenshots. Furthermore, the challenges encountered during Sprints 1 to 12 are documented along with their respective solutions.

## 5.1 Hardware Setup
The development and local hosting of the full-stack system were performed on a high-performance development machine to ensure stability during concurrent execution of the frontend, backend, and database services. The hardware specifications are detailed below:
*   **System Model:** Acer Nitro 5 (AN515-45 Series)
*   **Central Processing Unit (CPU):** AMD Ryzen 5 5600H with Radeon Graphics (6 Cores, 12 Threads)
*   **Memory (RAM):** 16GB DDR4 (Upgraded for virtualization and development overhead)
*   **Primary Storage:** 512GB NVMe M.2 SSD (High-speed I/O for database transactions)
*   **Display:** 15.6" Full HD (1920 x 1080) for multi-window development

This environment provided the necessary throughput to run the Next.js (Node.js) runtime, the Spring Boot (JVM) container, and the MySQL relational engine simultaneously, ensuring a responsive development and testing lifecycle.

## 5.2 Software Setup
The system leverages a modern technology stack designed for scalability and maintainability. The software dependencies and development environments used include:
*   **Backend Framework:** Java 17 (OpenJDK), Spring Boot 3.2.x, Maven 3.9 (Dependency and Build Management)
*   **Frontend Framework:** Node.js 18.x, Next.js 14.x (App Router), React 18, Tailwind CSS (Styling)
*   **Database Engine:** MySQL 8.0 Community Server (Relational storage with ACID compliance)
*   **Development Tools:**
    *   **IntelliJ IDEA Ultimate:** Primary IDE for Spring Boot and Java development.
    *   **VS Code / Cursor:** Primary editors for Next.js and frontend component design.
    *   **MySQL Workbench:** For schema design, ERD generation, and data inspection.
    *   **Postman:** For RESTful API endpoint testing and JSON payload verification.
*   **Version Control:** Git 2.x, hosted on GitHub for repository management and history tracking.

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

> **[Insert Screenshot Here: Checkout Page / Order Confirmation]**
> *Figure 5.4.5.1: The customer completing the checkout process.*

> **[Insert Screenshot Here: Admin Inventory Batches (Before Order)]**
> *Figure 5.4.5.2: The initial quantity of active batches before the customer's order.*

> **[Insert Screenshot Here: Admin Inventory Batches (After Order)]**
> *Figure 5.4.5.3: The updated quantity showing stock was correctly deducted from the earliest expiring batch (FEFO logic success).*

**Operational Narrative:**
The FEFO execution is managed by the `InventoryService` in the backend. When the customer confirms an order (Figure 5.4.5.1), the system does not simply decrement a global stock counter. Instead, it retrieves all active batches for the product, sorted by `expiry_date ASC`. As seen in Figure 5.4.5.2, Batch A (Exp: 2026-05-01) has 10 units and Batch B (Exp: 2026-06-01) has 20 units. If the customer orders 15 units, the system first exhausts all 10 units from Batch A and then "spills over" to deduct the remaining 5 units from Batch B. Figure 5.4.5.3 shows the result: Batch A is moved to 0 (and later archived/hidden), while Batch B is updated to 15 units. This ensures the grocer always ships the oldest sellable stock first.

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

**Technical Workflow:**
As demonstrated in Figure 5.4.7.1, the system highlights a "Net Requirement" for products trending upwards in sales. For instance, if a product shows a 25% momentum (demand growth), the algorithm increases the target stock. However, as shown in the internal metrics (Figure 5.4.7.2), if the calculated target stock exceeds the "Max Sellable Quantity" (calculated as `Adjusted Demand * Shelf Life`), the system caps the order to prevent spoilage. The "Decay Factor" further adjusts the order based on the waste lambda, ensuring that the grocer is protected against holding too much highly-perishable inventory.

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

## 5.5 Algorithm Implementation

This section documents the core algorithms that distinguish this system from conventional inventory platforms. Three algorithms are implemented in the Spring Boot backend: the **FEFO Batch Deduction Algorithm**, the **Adaptive Restocking Algorithm**, and the **Baseline (Static ROP) Restocking Algorithm**. The adaptive algorithm is compared against the baseline on the admin dashboard to demonstrate its superiority in reducing waste and preventing stockouts.

### 5.5.1 FEFO Batch Deduction Algorithm

The First-Expiry, First-Out (FEFO) deduction algorithm ensures that when a customer places an order, stock is always consumed from the batch closest to expiration. This minimizes spoilage by prioritising the sale of older inventory. The algorithm is implemented in the `InventoryService.deductStockFEFO()` method.

**Algorithm Logic:**

```
FUNCTION deductStockFEFO(productId, quantityRequired):
    batches ← GET all active batches for productId
                WHERE expiryDate >= today
                ORDER BY expiryDate ASC       // Earliest expiry first

    totalAvailable ← SUM(batch.availableQuantity for each batch)
    IF totalAvailable < quantityRequired THEN
        THROW InsufficientStockException

    remainingDeduction ← quantityRequired
    FOR EACH batch IN batches:
        deductAmount ← MIN(batch.availableQuantity, remainingDeduction)
        batch.availableQuantity ← batch.availableQuantity - deductAmount
        UPDATE batch in database
        remainingDeduction ← remainingDeduction - deductAmount
        IF remainingDeduction == 0 THEN BREAK

    DECREMENT product.stockQuantity by quantityRequired
    LOG stock movement as "ORDER_DEDUCT"
    TRIGGER real-time restock check
END FUNCTION
```

**Key Design Decisions:**
*   **Greedy Sequential Deduction:** The algorithm iterates through batches sorted by ascending expiry date. It fully exhausts each batch before moving to the next, ensuring that the oldest stock is always sold first.
*   **Spill-Over Logic:** If an order quantity exceeds a single batch (e.g., ordering 15 units when Batch A only has 10), the algorithm automatically "spills over" to the next batch (deducting 5 from Batch B), maintaining per-batch accuracy.
*   **Transactional Safety:** The method is wrapped with Spring's `@Transactional` annotation, ensuring that if any step fails (e.g., a database update error), all preceding changes are rolled back, preventing data inconsistencies.
*   **Event-Driven Restocking:** After every successful deduction, the algorithm triggers `purchaseOrderService.triggerRealTimeRestock()` to check if the product has fallen below its safety stock threshold, enabling proactive replenishment.

### 5.5.2 Adaptive Restocking Algorithm

The adaptive restocking algorithm is implemented in `RestockOptimizer.calculateRestock()`. Unlike traditional static Reorder Point (ROP) methods, this algorithm dynamically adjusts its recommendations based on demand momentum, sales volatility, seasonality, and perishability decay. It is designed to prevent both stockouts and over-ordering of perishable goods.

**Mathematical Formulation:**

**Step A — Demand Momentum (M):**

```
M = (Short_Term_Avg_3d - Long_Term_Avg_30d) / Long_Term_Avg_30d
```

Momentum captures whether demand is trending upward (M > 0) or downward (M < 0), allowing the algorithm to react to real-time sales surges.

**Step B — Adjusted Demand (D_adj):**

```
D_adj = Long_Term_Avg * (1 + β * M) * Seasonality_Factor
```

Where β (Beta) = 0.8 is a sensitivity coefficient controlling how aggressively the algorithm reacts to short-term trends, and Seasonality_Factor accounts for periodic demand fluctuations.

**Step C — Volatility-Adjusted Safety Stock (SS):**

```
CV = σ / Long_Term_Avg           (Coefficient of Variation)
Z_dynamic = Z_base * (1 + CV)     (Dynamic service-level Z-score)
SS = Z_dynamic * σ * √(Lead_Time)
```

Where Z_base = 1.65 (corresponding to a 95% service level) and σ is the 30-day standard deviation. Unlike static safety stock models, the dynamic Z-score increases the buffer when demand is highly volatile (high CV), providing stronger protection against stockouts.

**Step D — Perishability Cap:**

```
Max_Sellable_Qty = D_adj * Shelf_Life_Days
Safe_Target_Stock = MIN(Target_Stock, Max_Sellable_Qty)
```

This cap ensures the system never orders more than what can realistically be sold before the product expires, directly preventing over-ordering of perishable goods.

**Step E — Exponential Decay Factor:**

```
Decay_Factor = e^(-λ * Shelf_Life)
Raw_Order_Qty = Net_Requirement * Decay_Factor
```

Where λ (Lambda) is the historical waste rate. For highly perishable products with a high lambda, the decay factor significantly reduces the order quantity, accounting for the expected spoilage loss.

**Step F — Final Constraints:**

```
Final_Order_Qty = CEIL(Raw_Order_Qty)
Final_Order_Qty = ROUND_UP_TO(Case_Size)
IF Final_Order_Qty < Supplier_MOQ THEN Final_Order_Qty = Supplier_MOQ
```

The final quantity is rounded up to the nearest case size and enforced against the supplier's Minimum Order Quantity (MOQ).

**Algorithm Pseudocode:**

```
FUNCTION calculateRestock(metrics):
    // A. Demand Momentum
    momentum ← (avgSales3d - avgSales30d) / avgSales30d

    // B. Adjusted Demand
    adjustedDemand ← avgSales30d * (1 + 0.8 * momentum) * seasonalityFactor

    // C. Volatility Safety Stock
    cv ← stdDev30d / avgSales30d
    dynamicZ ← 1.65 * (1 + cv)
    safetyStock ← dynamicZ * stdDev30d * SQRT(leadTimeDays)

    // D. Perishability Cap
    maxSellable ← adjustedDemand * shelfLifeDays
    targetStock ← (adjustedDemand * reviewPeriod) + safetyStock
    safeTarget ← MIN(targetStock, maxSellable)

    // E. Decay & Net Requirement
    netRequirement ← safeTarget - (currentStock + incomingStock)
    decayFactor ← EXP(-wasteLambda * shelfLifeDays)
    rawOrderQty ← netRequirement * decayFactor

    // F. Constraints
    finalQty ← CEIL(rawOrderQty)
    finalQty ← ROUND_UP_TO_CASE_SIZE(finalQty)
    IF finalQty < supplierMOQ THEN finalQty ← supplierMOQ

    RETURN finalQty
END FUNCTION
```

### 5.5.3 Baseline (Static ROP) Restocking Algorithm

The baseline algorithm, implemented in `BaselineRestockOptimizer.calculateBaseline()`, serves as a **control model** against which the adaptive algorithm is evaluated. It uses the traditional Reorder Point (ROP) formula with static parameters.

**Key Differences from the Adaptive Algorithm:**

| Feature | Baseline (Static ROP) | Adaptive Algorithm |
|---|---|---|
| Demand Forecast | Uses only 30-day average (no momentum) | Incorporates 3-day vs 30-day momentum |
| Safety Stock Z-score | Static Z = 1.65 | Dynamic Z = 1.65 × (1 + CV) |
| Seasonality | Not considered (factor = 1.0) | Multiplicative seasonality factor |
| Perishability Cap | Not applied | Max Sellable Qty caps target stock |
| Decay Factor | Set to 1.0 (no decay) | Exponential decay e^(-λ × ShelfLife) |
| Incoming Stock | Not subtracted | Subtracted from net requirement |

**Baseline Formula:**

```
Target_Stock = (Avg_Sales_30d * Review_Period) + (1.65 * σ * √Lead_Time)
Net_Requirement = Target_Stock - Current_Stock
Order_Qty = CEIL(Net_Requirement)
```

By comparing both algorithms side-by-side on the Algorithm Evaluation Dashboard (Section 5.4.7.1), administrators can objectively verify that the adaptive algorithm produces more accurate and waste-conscious restocking recommendations than the static baseline.

## 5.6 Implementation Issues and Challenges
Throughout Sprints 1 to 12, several technical challenges were encountered and resolved. The following table summarizes the most significant issues:

| Issue | Phase | Solution Implemented |
|---|---|---|
| **CORS Policy Restrictions** | Sprint 2 | The Next.js frontend was initially blocked from communicating with the Spring Boot API. Resolved by implementing a global `WebMvcConfigurer` to explicitly allow `localhost:3000` via CORS mappings. |
| **Atomic CSV Processing** | Sprint 5 | Initial bulk uploads failed entirely if a single row was malformed. Re-engineered the `InventoryService` to implement row-level try-catch validation, allowing valid rows to pass while logging detailed error reports for the admin. |
| **FEFO Batch Sequential Logic** | Sprint 7-8 | Deducting stock when an order quantity exceeded a single batch caused data inconsistencies. Implemented a looping deduction algorithm that iterates through sorted batches until the requirement is met, ensuring accurate per-batch tracking. |
| **Transactional Integrity** | Sprint 9 | Potential race conditions between order checkout and spoilage logging could lead to "ghost stock." Applied Spring's `@Transactional` annotations to all critical service methods to guarantee ACID properties during stock state changes. |
| **Stateless Auth Interceptors** | Sprint 1 | Silent JWT expiration led to a broken user experience. Developed a frontend Axios interceptor to catch `401 Unauthorized` responses and automatically redirect users to the login portal with a clear notification. |

## 5.7 Concluding Remark
The implementation phase successfully translated the system design into a working, full-stack application. All core features—ranging from basic authentication and checkout to advanced inventory controls like FEFO deduction, spoilage logging, and predictive alerts—are fully operational. The structured approach to overcoming integration challenges ensures that the system is stable and prepared for systematic evaluation in the subsequent chapter.
