-- AlterCheckConstraint (added by hand: Prisma doesn't generate CHECK constraints)
ALTER TABLE "members" DROP CONSTRAINT "members_role_check";
ALTER TABLE "members" ADD CONSTRAINT "members_role_check" CHECK (role IN ('user', 'librarian', 'admin', 'super admin'));
