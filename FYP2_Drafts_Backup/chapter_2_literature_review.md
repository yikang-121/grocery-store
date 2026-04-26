# CHAPTER 2 – Literature Review (Market Analysis & Theoretical Framework)

This chapter provides a competitive analysis of the grocery e-commerce market to guide the prioritization of our Product Backlog.

## 2.1 Review of Competitors
Major platforms such as Walmart, Lotus’s, RedMart (Lazada), and local grocers like Village Grocer were analyzed to identify market gaps.

### 2.1.1 Enterprise Solutions (Walmart & RedMart)
While these platforms offer high-end AI-driven restocking and batch tracking, their solutions are tightly integrated with large-scale warehouse infrastructure, making them inaccessible for small-to-medium enterprises.

### 2.1.2 Local Retailers (Lotus’s, Village Grocer, Jaya Grocer)
These grocers have strong online presences but often rely on manual picker systems or disconnected inventory logs. Many lack visible FEFO-based deduction and predictive restocking at the customer-facing level.

## 2.2 Limitations of Existing Solutions
- **High Cost of Entry:** Existing "smart" inventory systems require expensive hardware and software licenses.
- **Disconnected Systems:** Front-end sales are often out-of-sync with back-end spoilage logs.
- **Generic Logic:** Most e-commerce plugins use simple FIFO (First-In, First-Out) logic, which is unsuitable for perishables.

## 2.3 Proposed Solution (Product Differentiation)
Our product fills the market gap by delivering a lightweight, integrated e-commerce engine that treats **Inventory as a First-Class Citizen**. Unlike generic platforms, this system automatically handles batch-level expiry during the sales process, ensuring that SME grocers can compete with larger players by minimizing waste.

## 2.4 Algorithm Evaluation (Theoretical Framework)
To support future predictive features, this study adopts a comparative framework between a **Baseline Algorithm** (Continuous Review) and a **Proposed Predictive Algorithm**.
- **The Baseline:** Uses 30-day Simple Moving Averages.
- **The Proposed Model:** Integrates *demand momentum*, *spoilage constraints* (Decay Factor), and *dynamic safety stock* (Volatility).
This theoretical backing ensures that our predictive restock alerts (PB6) are grounded in proven inventory management theories.
