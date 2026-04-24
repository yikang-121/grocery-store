# Chapter 4: System Design Updates (FYP2)

This document contains the updated diagrams you need to include in your Chapter 4 to reflect the advanced systems you built during FYP2. You can use a tool like [Mermaid Live Editor](https://mermaid.live/) to convert these code blocks into high-quality images for your Word document, or screenshot them directly if your markdown viewer supports them!

## 1. Updated Entity Relationship Diagram (ERD)
You need to show the examiners that you updated the database schema to support the new features (Batches, Stock Movements, Purchase Orders, and Spoilage). 

```mermaid
erDiagram
    PRODUCT ||--o{ BATCH : "has many"
    PRODUCT ||--o{ STOCK_MOVEMENT : "tracked via"
    PRODUCT ||--o{ PURCHASE_ORDER_ITEM : "restocked via"

    BATCH ||--o{ SPOILAGE_LOG : "generates"
    BATCH ||--o{ STOCK_MOVEMENT : "audited by"

    ORDER ||--o{ ORDER_ITEM : "contains"
    ORDER_ITEM }o--|| PRODUCT : "references"
    		
    PURCHASE_ORDER ||--o{ PURCHASE_ORDER_ITEM : "contains"

    PRODUCT {
        int id PK
        varchar name
        varchar sku
        int total_stock
        decimal unit_price
    }

    BATCH {
        int id PK
        int product_id FK
        varchar batch_number
        int quantity
        date expiry_date
    }

    STOCK_MOVEMENT {
        int id PK
        int product_id FK
        int batch_id FK
        varchar movement_type "e.g., STOCK_IN, ORDER_DEDUCT, SPOILAGE"
        int quantity
        varchar notes
        datetime created_at
    }

    SPOILAGE_LOG {
        int id PK
        int batch_id FK
        int quantity
        varchar reason
        datetime created_at
    }
```

*Figure 4.x.x: The updated logical Entity Relationship Diagram showing the relationships necessary for batch-level tracking, audit trails, and purchasing.*

---

## 2. Activity Diagram: FEFO (First-Expired, First-Out) Deduction
This diagram shows the complex workflow your Spring Boot backend runs when a customer checks out, proving to the examiners how you handled the batch-spillover logic.

```mermaid
flowchart TD
    A([Customer Clicks Place Order]) --> B{Are all cart items in stock?}
    B -- No --> C([Reject Order & Alert Customer])
    B -- Yes --> D[Create Order & Save Payment]
    D --> E[Fetch Cart Item]
    
    E --> F[Fetch Active Batches for Product]
    F --> G[Sort Batches by Expiry Date ASC]
    
    G --> H{Is DeductionQty > 0?}
    H -- No --> I{More products in cart?}
    
    H -- Yes --> J[Select Earliest Expiring Batch]
    J --> K{Batch Qty >= DeductionQty?}
    
    K -- Yes --> L[Subtract DeductionQty from Batch]
    L --> M[Generate STOCK_MOVEMENT 'Order Deduct']
    M --> N[DeductionQty = 0]
    N --> H
    
    K -- No --> O[Deduction = Batch Qty]
    O --> P[Set Batch Qty = 0]
    P --> Q[Generate STOCK_MOVEMENT 'Order Deduct']
    Q --> R[DeductionQty = DeductionQty - Deduction]
    R --> J
    
    I -- Yes --> E
    I -- No --> S([Order Checkout Complete])
```

*Figure 4.x.x: Activity diagram illustrating the recursive FEFO batch deduction process during customer checkout.*

---

## 3. Activity Diagram: Adaptive Predictive Restocking Algorithm
This diagram maps out how your new `Algorithm Evaluation Dashboard` decides exactly how many units to reorder by comparing the baseline (legacy) versus the adaptive algorithm.

```mermaid
flowchart TD
    A([Admin Clicks Sync Database Metrics]) --> B[Fetch 30-Day Sales Data]
    B --> C[Fetch Current Stock Levels]
    C --> D[Calculate BASELINE: Static ROP / EOQ]
    
    D --> E[Calculate ADAPTIVE: Net Requirement]
    E --> F[Calculate Dynamic Z-Score & Velocity]
    F --> G[Apply Seasonality & Decay Factor]
    G --> H[Determine Target Stock]
    
    H --> I{Is Target Stock > Spoilage Cap?}
    I -- Yes --> J[Apply Spoilage Cap Constraint]
    I -- No --> K[Approve Target Stock]
    
    J --> L[Finalize Suggested Restock Unit]
    K --> L
    
    L --> M[Compare Baseline Result vs Adaptive Result]
    M --> N[Update Dashboard Cards & Trends]
    
    N --> O{Is Stock < Adaptive Reorder Point?}
    O -- Yes --> P[Generate Smart-Restock Purchase Order]
    O -- No --> Q([End Process])
    P --> Q
```

*Figure 4.x.x: Activity diagram detailing the calculation flow of the Adaptive Predictive Restocking Algorithm including Spoilage Prevention constraints.*
