create table whatsapp_logs (
    id uuid default gen_random_uuid() primary key,
    phone text not null,
    message text not null,
    status text not null,
    error_message text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    metadata jsonb
);

create index whatsapp_logs_created_at_idx on whatsapp_logs(created_at desc);
create index whatsapp_logs_status_idx on whatsapp_logs(status);
create index whatsapp_logs_phone_idx on whatsapp_logs(phone); 