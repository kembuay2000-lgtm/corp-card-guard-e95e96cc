-- Create enum for user roles
create type public.app_role as enum ('auditor', 'rh', 'admin');

-- Create profiles table
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  full_name text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.profiles enable row level security;

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamp with time zone not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Create transactions table
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  ano_extrato integer not null,
  mes_extrato integer not null,
  cpf_portador text not null,
  nome_portador text not null,
  tipo_transacao text not null,
  data_transacao date not null,
  valor_transacao numeric(12, 2) not null,
  cnpj_cpf_favorecido text,
  nome_favorecido text,
  categoria text,
  created_at timestamp with time zone not null default now()
);

alter table public.transactions enable row level security;

-- Create alerts table
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references public.transactions(id) on delete cascade,
  alert_type text not null,
  severity text not null check (severity in ('high', 'medium', 'low')),
  title text not null,
  description text not null,
  amount numeric(12, 2) not null,
  alert_date date not null,
  location text,
  card_holder text not null,
  status text not null default 'pending' check (status in ('pending', 'under_review', 'resolved', 'false_positive')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone not null default now()
);

alter table public.alerts enable row level security;

-- Create security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

-- Create trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- RLS Policies for user_roles
create policy "Users can view their own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can manage all roles"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for transactions
create policy "Auditors and RH can view all transactions"
  on public.transactions for select
  to authenticated
  using (
    public.has_role(auth.uid(), 'auditor') or
    public.has_role(auth.uid(), 'rh') or
    public.has_role(auth.uid(), 'admin')
  );

create policy "Auditors can insert transactions"
  on public.transactions for insert
  to authenticated
  with check (
    public.has_role(auth.uid(), 'auditor') or
    public.has_role(auth.uid(), 'admin')
  );

-- RLS Policies for alerts
create policy "Auditors and RH can view all alerts"
  on public.alerts for select
  to authenticated
  using (
    public.has_role(auth.uid(), 'auditor') or
    public.has_role(auth.uid(), 'rh') or
    public.has_role(auth.uid(), 'admin')
  );

create policy "Auditors can create alerts"
  on public.alerts for insert
  to authenticated
  with check (
    public.has_role(auth.uid(), 'auditor') or
    public.has_role(auth.uid(), 'admin')
  );

create policy "Auditors and RH can update alerts"
  on public.alerts for update
  to authenticated
  using (
    public.has_role(auth.uid(), 'auditor') or
    public.has_role(auth.uid(), 'rh') or
    public.has_role(auth.uid(), 'admin')
  );

-- Create indexes for better performance
create index idx_transactions_cpf on public.transactions(cpf_portador);
create index idx_transactions_date on public.transactions(data_transacao);
create index idx_transactions_valor on public.transactions(valor_transacao);
create index idx_alerts_status on public.alerts(status);
create index idx_alerts_severity on public.alerts(severity);
create index idx_alerts_date on public.alerts(alert_date);

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for profiles updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();