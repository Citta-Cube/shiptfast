
# Freight Forwarder Portal UI/UX Documentation (Data-Driven Approach)

## 1. Dashboard

### Purpose
Provide forwarders with an efficient overview of order opportunities and quote statuses based on available data.

### Key Features & Data Sources
- **Metrics Overview**:
  - Open Orders requiring quotes (`orders` table with status='OPEN' and forwarder invited in `order_selected_forwarders`)
  - Pending Quotes awaiting decisions (`quotes` table with status='ACTIVE')
  - Won Orders count (`orders` where selected_quote_id points to forwarder's quote)
  - Current Rating display (from `companies.average_rating` and `total_ratings`)

- **Order Management Panel**:
  - Tabbed view based on order statuses:
    - Open: Orders in `order_selected_forwarders` where forwarder is invited but `is_submitted=false`
    - Pending: Orders with `quotes` submitted but no decision (status='ACTIVE')
    - Selected: Orders where `selected_quote_id` matches forwarder's quote
    - Rejected: Quotes with status='REJECTED'
  - Each order card shows:
    - Reference number (`orders.reference_number`)
    - Company name (via `orders.exporter_id` linking to `companies.name`)
    - Shipment type and load type (`orders.shipment_type` and `orders.load_type`)
    - Origin/Destination ports (from `ports` table via `orders.origin_port_id` and `destination_port_id`)
    - Quotation deadline with time remaining (from `orders.quotation_deadline`)
    - Urgent indicator (from `orders.is_urgent`)
  - Filtering by `shipment_type`, `load_type`, and order `status`

## 2. Orders Management
### Purpose
Detailed order view with quoting capabilities leveraging available database fields.

### Key Features & Data Sources
- **Order Detail View**:
  - Order header information (`orders` table fields: reference_number, cargo_ready_date, quotation_deadline)
  - Cargo details (from `orders.order_details` JSONB)
  - Document viewer (from `documents` table where entity_type='ORDER' and entity_id=order_id)
  - Quote submission form capturing:
    - Net freight cost (stored in `quotes.net_freight_cost`)
    - Estimated delivery time (`quotes.estimated_time_days`)
    - Validity period (`quotes.validity_period_days`)
    - Notes field (`quotes.note`)
    - Additional details in `quotes.quote_details` JSONB
  - Quote history (previous quotes from `quotes` table, amendments from `quote_amendments`)
  - Status indicators (`quotes.status`, `order_selected_forwarders` flags)

- **Quote Actions**:
  - Submit quote (insert to `quotes` table, update `order_selected_forwarders.is_submitted`)
  - Edit quote (update `quotes` table, triggering `quote_amendments` via trigger)
  - Cancel quote (update `quotes.status` to 'CANCELLED')
  - Quote status tracking (monitor `quotes.status`)
  - Route planning with transshipment ports (using `transshipment_ports` table)

## 3. Company Relationships
### Purpose
Manage relationships with exporters using relationship data.

### Key Features & Data Sources
- **Exporter List**:
  - Status indicators (from `forwarder_relationships.status`)
  - Order count (count from `orders` where exporter_id matches)
  - Rating display (from `companies.average_rating` for exporters)
  - Last interaction (latest date from `orders`, `quotes`, or `order_messages`)

- **Exporter Detail**:
  - Company information (from `companies` table: name, email, business details)
  - Order history (from `orders` where exporter_id matches)
  - Communication history (from `order_messages` filtered by exporter company members)
  - Performance metrics (from `company_ratings` with relevant ratee_company_id)

## 4. Settings

### Purpose
Manage company profile and preferences with database integration.

### Key Features & Data Sources
- **Profile Management**:
  - Company details (edit `companies` table: name, email, phone, website, address)
  - Service offerings (manage `forwarder_services` entries)
  - Logo and description (update `companies.iconUrl` and `description`)
  - Verification documents (upload to `documents` with entity_type='COMPANY')
  - Business registration details (`companies.business_registration_number`, `vat_number`, etc.)

- **Team Management**:
  - Manage team members (CRUD operations on `company_members`)
  - Assign roles (update `company_members.role`)
  - Set permissions based on roles

## 5. Communication

### Purpose
Order-specific messaging with exporters using existing message structures.

### Key Features & Data Sources
- **Order Messages**:
  - Threaded conversations (from `order_messages` filtered by order_id)
  - Message history with sender/receiver info (join `order_messages` with `company_members`)
  - File attachments (supporting documents from `documents` table)
  - Unread message indicators (requiring frontend tracking)

- **Notification System** (requires additional implementation):
  - Event-based notifications for:
    - New order invitations (`order_selected_forwarders.is_notified`)
    - Quote status changes
    - New messages
    - Approaching deadlines

## Key UX Principles with Data Considerations

1. **Efficiency First**
   - Optimize database queries for dashboard load times
   - Cache frequently accessed data (ratings, order counts)
   - Use indexed queries for performance (utilize existing indexes)

2. **Context-Aware Interfaces**
   - Base UI state on order/quote status enum values
   - Calculate time-sensitive displays server-side (e.g., quotation deadlines)
   - Apply conditional logic based on relationship status

3. **Data Integrity**
   - Validate form inputs against database constraints
   - Respect entity relationships in UI flows
   - Handle data dependencies (e.g., can't quote without invitation)

4. **Real-time Updates**
   - Implement notifications for critical status changes
   - Show quota/rate limits based on usage patterns
   - Monitor response times and optimize heavy queries

This data-driven approach ensures all UI components and user flows align with the available database structure, creating a cohesive and technically feasible implementation.
