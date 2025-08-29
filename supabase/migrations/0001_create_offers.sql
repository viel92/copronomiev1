create table offers (
  id uuid primary key default gen_random_uuid(),
  fournisseur text not null,
  "typeContrat" text not null,
  "prixMolecule" numeric not null,
  cee numeric not null,
  transport numeric not null,
  "abonnementF" numeric not null,
  distribution numeric not null,
  "transportAnn" numeric not null,
  cta numeric not null,
  ticgn numeric not null,
  "consommationReference" numeric,
  "sourceFile" text,
  user_id uuid not null references auth.users(id)
);

alter table offers enable row level security;

create policy "Offer access by owner" on offers
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
