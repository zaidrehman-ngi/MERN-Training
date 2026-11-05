-- A bcrypt hash is always exactly 60 characters ($2b$ + cost + 22 salt + 31 hash),
-- whatever the password or the cost, so the column is CHAR(60).
-- AlterTable
ALTER TABLE "members" ALTER COLUMN "password_hash" SET DATA TYPE CHAR(60);

-- AddCheckConstraint (added by hand: Prisma doesn't generate CHECK constraints)
-- Only a bcrypt hash can go in here, so a plain-text password can't be saved by mistake.
ALTER TABLE "members" ADD CONSTRAINT "members_password_hash_bcrypt_check"
    CHECK (password_hash ~ '^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$');
