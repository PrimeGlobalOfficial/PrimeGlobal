# Prime Global Admin Setup

This guide configures the restricted administrator review dashboard.

## Dashboard

After GitHub Pages publishes the commit, open:

https://primeglobalofficial.github.io/PrimeGlobal/admin-review.html

The dashboard uses Supabase Auth and checks administrator status in the database. A signed-in account is **not** automatically an administrator.

## Grant administrator access safely

1. Sign in to the Supabase Dashboard and open the SQL Editor for project `aehmswdhykcdpkqzbjgl`.
2. Run this read-only query to identify the exact account you intend to authorize:

```sql
select id, email, created_at
from auth.users
order by created_at;
```

3. Confirm the email belongs to you and copy its exact UUID.
4. Run the following statement, replacing the placeholder with that UUID. Do not use an email address in place of the UUID.

```sql
insert into public.prime_global_admins (user_id)
values ('REPLACE-WITH-YOUR-USER-UUID')
on conflict (user_id) do nothing;
```

5. Sign in at the admin dashboard with that same account, then refresh the queue.

To revoke access, run:

```sql
delete from public.prime_global_admins
where user_id = 'REPLACE-WITH-YOUR-USER-UUID';
```

Keep administrator access limited to trusted accounts. Never place a Supabase secret/service-role key in a browser file or share it in GitHub.

## What the dashboard can do

- Verify or reject employer profile requests.
- Publish, reject, or close submitted job listings.
- Review submitted listing details and application routes.

Only published jobs are intended to appear on the public Live Jobs Board. Verify the company and application route before publishing. The dashboard and database changes still need end-to-end testing with a real signed-in administrator and test employer before the site is opened to the public.
