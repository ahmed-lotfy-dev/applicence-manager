-- Convert projects.total_amount from cents to base units (EGP).
-- Only applies to values still in cents (> 1,000,000) so it's safe to re-run.
UPDATE projects SET total_amount = ROUND(total_amount / 100) WHERE total_amount > 1000000;
