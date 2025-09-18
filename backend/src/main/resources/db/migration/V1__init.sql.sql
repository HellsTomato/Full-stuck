create table if not exists athletes (
  id uuid primary key,
  full_name varchar(200) not null,
  birth_date date not null,
  grp varchar(50) not null,
  phone varchar(50),
  notes text,
  status varchar(20) not null default 'active'
);

