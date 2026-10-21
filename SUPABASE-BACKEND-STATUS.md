# Prime Global Supabase Backend Status

Last updated: 2026-10-21

## Existing backend

The connected Supabase project already includes:
- `profiles`: member profile data linked to Supabase Auth
- `referral_codes`, `referrals`, `referral_program_settings`
- `referral_rewards`, `withdrawal_requests`, `task_submissions`

These tables have Row Level Security enabled. Security policies and administrator workflows still require periodic review before production use.

## Phase 1 database foundation added

The following tables were added to the connected Supabase project:
- `employer_profiles`: employer/company profile and verification status
- `jobs`: job listings, eligibility, application route, and moderation status
- `saved_jobs`: member bookmarks
- `job_applications`: applications and application status

Indexes and RLS policies were added. Published jobs are publicly readable; member bookmarks and applications are scoped to their owner; employer access is scoped to the employer's own records and jobs.

## Important implementation status

**The database tables exist, but this does not mean the website UI is fully connected to them yet.** The next engineering step is to connect job search, saved jobs, applications, and employer submission screens to these tables and test with separate member and employer accounts.

Before public production use:
1. Review and test every RLS policy with anonymous, member, employer, and administrator accounts.
2. Add a trusted moderation workflow so job publication cannot rely only on a client-side status.
3. Enable Supabase leaked-password protection.
4. Review the existing task-review and withdrawal Edge Functions and administrator authorization.
5. Test signup, email confirmation, login, password reset, profile loading, referrals, task submission, and withdrawal requests.
6. Never put Supabase secret/service-role keys in GitHub Pages or browser code. A publishable key may be used in a frontend only with correct RLS and least-privilege grants.

## Phase 2 roadmap

- Finish and test referrals, reward qualification, and manual withdrawal review
- Add admin moderation and employer verification
- Add notifications and audit history
- Keep payments manual until there is a verified, legally appropriate payment workflow; do not promise or automatically issue earnings without approved funding and review
