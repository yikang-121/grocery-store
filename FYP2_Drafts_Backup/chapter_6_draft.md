# Chapter 6: System Evaluation and Discussion

This chapter details the testing methodologies applied to the E-Commerce Website and Inventory System to ensure its reliability, accuracy, and performance. It presents the test cases conducted for both the core e-commerce functionalities and the advanced inventory modules (FEFO, Spoilage, and Restocking). Furthermore, the overall project challenges are discussed, and a thorough evaluation of the system against its predefined objectives is provided.

## 6.1 System Testing and Performance Metrics
A comprehensive testing strategy was employed to validate the system, utilizing a combination of Black-Box Testing and Integration Testing:
*   **Black-Box Testing:** Focused on validating the functional requirements from the perspective of an end-user and administrator via the Next.js frontend interfaces. This ensured that inputs such as user registration data, CSV uploads, and spoilage forms produced the expected outputs.
*   **Integration Testing:** Ensured that the interactions between the Next.js frontend, Spring Boot backend, and MySQL database functioned flawlessly, particularly during complex transactions like FEFO algorithmic stock deductions and automated audit logging.

Performance was evaluated against the non-functional requirement that operations—especially customer checkout and bulk inventory processing—must execute rapidly without crashing, even when handling complex batch logic.

## 6.2 Testing Setup and Result
The system was tested module by module. The following tables outline the critical test cases executed, their expected outcomes, and the achieved results.

### 6.2.1 Core E-Commerce Modules Testing
These tests validate the foundational features developed in the earlier phases of the project.

| Test Case ID | Module | Test Input / Action | Expected Output | Result |
|---|---|---|---|---|
| TC-001 | Authentication | Attempt registration with an email that already exists. | System rejects registration and displays "Email already exists" error. | **Pass** |
| TC-002 | Authentication | User logs in with correct credentials. | JWT token generated, user redirected to the home page or admin dashboard. | **Pass** |
| TC-003 | Checkout | Customer checks out with items exceeding available stock limits. | System prevents checkout and highlights the out-of-stock items in the cart. | **Pass** |

### 6.2.2 FEFO Deduction Module Testing
This section evaluates the accuracy of the First-Expired-First-Out algorithmic deduction.

| Test Case ID | Test Scenario | Expected Output | Result |
|---|---|---|---|
| TC-004 | Single-batch deduction (Order Qty < Batch Qty) | System reliably deducts stock from the single active batch. | **Pass** |
| TC-005 | Multi-batch deduction (Order Qty > Earliest Batch Qty) | System exhausts the earliest expiring batch, and spills the remaining deduction over to the next chronological batch. | **Pass** |
| TC-006 | Audit Trail Verification | The database `order_items` and `stock_movements` accurately link the deduction to the correct `batch_id`. | **Pass** |

### 6.2.3 Spoilage and Damage Logging Testing
Testing the system's ability to maintain real-time accuracy when stock is manually removed.

| Test Case ID | Test Scenario | Expected Output | Result |
|---|---|---|---|
| TC-007 | Valid Spoilage Log Entry | Administrator logs 5 expired items. System reduces `inventory_batches` by 5 and generates a log. | **Pass** |
| TC-008 | Invalid Quantity Entry | Administrator attempts to log a spoilage quantity greater than the active batch's stock. | System rejects the entry with an error message to prevent negative stock. | **Pass** |
| TC-009 | Spoilage Audit Integrity | Verifying the backend creates a `SPOILAGE` type record in the `stock_movements` table. | **Pass** |

### 6.2.4 Predictive Restocking & Bulk Upload Testing
Validating automated alerts and mass-inventory management capabilities.

| Test Case ID | Test Scenario | Expected Output | Result |
|---|---|---|---|
| TC-010 | Restock Alert Generation | System calculates that active stock has fallen below the moving-average threshold. | A restock alert is flagged, and a draft Purchase Order is generated automatically. | **Pass** |
| TC-011 | Zero-Sales Edge Case | Product has 0 sales in the last 14 days. | System handles the null-average gracefully without crashing, setting threshold to 0. | **Pass** |
| TC-012 | Invalid CSV Upload | Administrator uploads a CSV file missing a critical field (e.g., product SKU). | System accepts valid rows, but highlights the malformed row in an error report. | **Pass** |

## 6.3 Project Challenges
Developing an enterprise-grade inventory system as a solo developer posed several significant challenges:
1.  **Algorithmic Complexity in FEFO:** Designing the backend logic to handle order quantities that span across multiple expiry batches required complex recursive iteration in the Spring Boot `OrderService` to prevent data corruption.
2.  **Concurrency and Data Integrity:** Ensuring that stock was not over-sold if a customer ordered an item at the exact moment an administrator logged spoilage. This was mitigated by implementing `@Transactional` database locks.
3.  **Cross-Origin Communication:** Establishing secure, seamless communication between the independent Next.js frontend and Spring Boot API required intricate CORS and stateless JWT boundary management.

## 6.4 Objectives Evaluation
The following table provides a final evaluation of the project against the initial objectives outlined in Chapter 1.

| Objective | Description | Evaluation / Achievement Status |
|---|---|---|
| **Objective 1** | To develop an expiry-aware FEFO deduction system to reduce inventory waste. | **Achieved:** The checkout service successfully prioritizes stock deduction based on batch expiry dates, solving the FIFO limitations of generic e-commerce platforms. |
| **Objective 2** | To integrate a real-time spoilage and damage logging mechanism. | **Achieved:** Administrators can successfully log perished goods, which instantly corrects live stock levels and generates a permanent audit trail. |
| **Objective 3** | To design a bulk inventory upload feature using CSV file processing. | **Achieved:** The system allows rapid stock entry via CSV, drastically reducing the manual entry time previously required, complete with row-level error handling. |
| **Objective 4** | To implement a predictive restocking algorithm based on sales trends. | **Achieved:** An automated analytical module accurately forecasts required stock relative to 14-day sales averages, proactively averting stockouts. |

## 6.5 Concluding Remark
The testing and evaluation phases confirm that the E-Commerce Website and Inventory System operates reliably under its specified conditions. The custom-built inventory controls function flawlessly within the e-commerce architecture. Importantly, the project has successfully addressed all four of its core objectives, delivering a tangible, technological step forward for small-to-medium grocery enterprises managing perishable goods.
