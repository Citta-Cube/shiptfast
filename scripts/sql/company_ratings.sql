create table public.company_ratings (
    id uuid not null default extensions.uuid_generate_v4(),
    order_id uuid not null,
    rater_company_id uuid not null,
    ratee_company_id uuid not null,
    average_score decimal(3,2) not null,
    rating_categories jsonb not null default '{
        "service_quality": 1,
        "on_time_delivery": 1,
        "reliability": 1
    }'::jsonb,
    comment text,
    created_by uuid not null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint company_ratings_pkey primary key (id),
    constraint company_ratings_order_id_rater_company_id_key unique (order_id, rater_company_id),
    constraint company_ratings_order_id_fkey foreign key (order_id) references orders(id),
    constraint company_ratings_rater_company_id_fkey foreign key (rater_company_id) references companies(id),
    constraint company_ratings_ratee_company_id_fkey foreign key (ratee_company_id) references companies(id),
    constraint company_ratings_created_by_fkey foreign key (created_by) references auth.users(id),
    constraint company_ratings_score_check check (average_score >= 1 and average_score <= 5),
    constraint company_ratings_different_companies check (rater_company_id != ratee_company_id)
);

-- Indexes for better query performance
create index idx_company_ratings_order_id on public.company_ratings using btree (order_id);
create index idx_company_ratings_rater_company_id on public.company_ratings using btree (rater_company_id);
create index idx_company_ratings_ratee_company_id on public.company_ratings using btree (ratee_company_id);

-- Enable RLS
alter table public.company_ratings enable row level security;

-- Trigger to update the updated_at column
create or replace function public.update_company_ratings_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql security definer;

create or replace trigger update_company_ratings_updated_at
    before update on public.company_ratings
    for each row execute procedure public.update_company_ratings_updated_at();

-- Trigger to validate rating categories and calculate average
create or replace function public.validate_and_calculate_rating()
returns trigger as $$
begin
    -- Ensure all required categories exist
    if not (
        new.rating_categories ? 'service_quality' and
        new.rating_categories ? 'on_time_delivery' and
        new.rating_categories ? 'reliability' 
    ) then
        raise exception 'Missing required rating categories';
    end if;

    -- Validate that all scores are between 1 and 5
    if not (
        (new.rating_categories->>'service_quality')::decimal between 1 and 5 and
        (new.rating_categories->>'on_time_delivery')::decimal between 1 and 5 and
        (new.rating_categories->>'reliability')::decimal between 1 and 5
    ) then
        raise exception 'Rating scores must be between 1 and 5';
    end if;

    -- Calculate average score from categories
    new.average_score = (
        (new.rating_categories->>'service_quality')::decimal +
        (new.rating_categories->>'on_time_delivery')::decimal +
        (new.rating_categories->>'reliability')::decimal 
    ) / 3.0;

    return new;
end;
$$ language plpgsql security definer;

create or replace trigger validate_and_calculate_rating
    before insert or update on public.company_ratings
    for each row execute procedure public.validate_and_calculate_rating();

-- Function to update company average rating
create or replace function public.update_company_average_rating()
returns trigger as $$
begin
    if TG_OP = 'DELETE' then
        -- Update average for company when rating is deleted
        update public.companies
        set average_rating = (
            select coalesce(round(avg(average_score)::numeric, 2), null)
            from public.company_ratings
            where ratee_company_id = OLD.ratee_company_id
        ),
        total_ratings = (
            select count(*)
            from public.company_ratings
            where ratee_company_id = OLD.ratee_company_id
        )
        where id = OLD.ratee_company_id;
        return OLD;
    else
        -- Update average for company when rating is inserted or updated
        update public.companies
        set average_rating = (
            select round(avg(average_score)::numeric, 2)
            from public.company_ratings
            where ratee_company_id = NEW.ratee_company_id
        ),
        total_ratings = (
            select count(*)
            from public.company_ratings
            where ratee_company_id = NEW.ratee_company_id
        )
        where id = NEW.ratee_company_id;
        return NEW;
    end if;
end;
$$ language plpgsql security definer;

-- Create triggers for insert, update, and delete operations
create or replace trigger update_company_average_rating_on_insert
    after insert on public.company_ratings
    for each row
    execute function public.update_company_average_rating();

create or replace trigger update_company_average_rating_on_update
    after update of average_score on public.company_ratings
    for each row
    execute function public.update_company_average_rating();

create or replace trigger update_company_average_rating_on_delete
    after delete on public.company_ratings
    for each row
    execute function public.update_company_average_rating();