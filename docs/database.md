# Database Structure

## Core Entities
### Companies
- **companies**: Central entity with `id`, `name`, `email`, `type` (EXPORTER/FREIGHT_FORWARDER), `business_registration_number`, `is_verified`, `average_rating`, `total_ratings`, `metadata`(jsonb)
- **company_members**: Users within companies with roles (ADMIN/MANAGER/OPERATOR/VIEWER), includes `user_id` (references auth.users), `company_id`, `role`, `job_title`, `first_name`, `last_name`

### Orders & Shipping
- **orders**: Shipping orders with `reference_number`, `exporter_id`, `shipment_type`(AIR/SEA), `load_type`, `incoterm`, `cargo_ready_date`, `quotation_deadline`, `origin_port_id`, `destination_port_id`, `status`, `order_details`(jsonb)
- **ports**: Contains `port_code`, `name`, `country_code`, `service`(AIR/SEA)
- **transshipment_ports**: Links `quote_id` with `port_id` with `sequence_number` for multi-port routes

### Quotes & Negotiations
- **quotes**: Submitted by forwarders with `order_id`, `freight_forwarder_id`, `net_freight_cost`, `estimated_time_days`, `validity_period_days`, `status`(ACTIVE/CANCELLED/EXPIRED/REJECTED), `quote_details`(jsonb)
- **quote_amendments**: Tracks quote changes with `quote_id`, `previous_net_freight_cost`, `new_net_freight_cost`, `reason`
- **order_selected_forwarders**: Links orders with invited forwarders, includes `is_submitted`, `is_rejected`, `is_notified` flags

### Relationships
- **forwarder_relationships**: Manages exporter-forwarder connections with `exporter_id`, `forwarder_id`, `status`(ACTIVE/INACTIVE/BLACKLISTED)
- **forwarder_services**: Services offered by forwarders (AIR/SEA)

### Communication & Documents
- **order_messages**: Messages between users about orders with `order_id`, `sender_id`, `to_id`, `message`
- **documents**: Files linked to orders or companies with `title`, `file_url`, `entity_type`(ORDER/COMPANY), `entity_id`, `metadata`(jsonb)

### Ratings
- **company_ratings**: Performance ratings with `order_id`, `rater_company_id`, `ratee_company_id`, `average_score`(1-5), `rating_categories`(jsonb) for service_quality, on_time_delivery, reliability

## Authentication & User Management
- Uses **Supabase Auth** system with default `auth.users` table
- User accounts are linked to company members via `user_id` foreign key
- Role-based access control through `company_members.role`

## Key Relationships
- Exporters create orders, select forwarders to invite for quotes
- Forwarders submit quotes for orders they're invited to
- Companies manage relationships (activate/blacklist)
- Orders can have documents, messages, ratings attached
- Quotes can have transshipment ports for complex routes
- Companies have members with different permission levels

## Common Fields
- Most tables include `id`(uuid), `created_at`, `updated_at` 
- Extensive use of foreign keys to maintain referential integrity
- Jsonb fields for flexible schema (`metadata`, `order_details`, `quote_details`, `rating_categories`)

## Important Enums
- company_type: EXPORTER, FREIGHT_FORWARDER
- company_role: ADMIN, MANAGER, OPERATOR, VIEWER
- service: AIR, SEA
- order_status: OPEN, QUOTED, BOOKED, COMPLETED, CANCELLED
- quote_status: ACTIVE, CANCELLED, EXPIRED, REJECTED
- status: ACTIVE, INACTIVE, BLACKLISTED