create table instances (
  id uuid default gen_random_uuid() primary key,
  instance_name text not null,
  instance_id text not null,
  is_default boolean default false,
  status text default 'disconnected',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger para atualizar o updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_instances_updated_at
  before update on instances
  for each row
  execute function update_updated_at_column();

-- Índice para busca rápida por instance_id
create index idx_instances_instance_id on instances(instance_id);

-- Índice para busca rápida por is_default
create index idx_instances_is_default on instances(is_default); 