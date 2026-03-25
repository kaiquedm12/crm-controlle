-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'USER');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User"
ALTER COLUMN "role" TYPE "UserRole_new"
USING (
    CASE
        WHEN "role"::text = 'ADMIN' THEN 'TENANT_ADMIN'
        WHEN "role"::text = 'MANAGER' THEN 'USER'
        WHEN "role"::text = 'SELLER' THEN 'USER'
        ELSE 'USER'
    END
::"UserRole_new"
);
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- CreateTable
CREATE TABLE "Tenant" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- Legacy backfill tenant bootstrap
INSERT INTO "Tenant" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES ('legacy-tenant', 'Legacy Tenant', 'legacy', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- AlterTable: add tenant columns as nullable first
ALTER TABLE "Activity" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Cadence" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "CadenceExecution" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "CadenceStep" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Deal" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Lead" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "LeadTag" DROP CONSTRAINT "LeadTag_pkey";
ALTER TABLE "LeadTag" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Message" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Pipeline" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "RefreshToken" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Stage" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Tag" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "User" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';

-- Backfill by relationship chain
UPDATE "User" SET "tenantId" = 'legacy-tenant' WHERE "tenantId" IS NULL;

UPDATE "RefreshToken" rt
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE rt."userId" = u."id"
    AND rt."tenantId" IS NULL;

UPDATE "Pipeline" SET "tenantId" = 'legacy-tenant' WHERE "tenantId" IS NULL;

UPDATE "Stage" s
SET "tenantId" = p."tenantId"
FROM "Pipeline" p
WHERE s."pipelineId" = p."id"
    AND s."tenantId" IS NULL;

UPDATE "Stage" SET "tenantId" = 'legacy-tenant' WHERE "tenantId" IS NULL;

UPDATE "Lead" l
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE l."ownerId" = u."id"
    AND l."tenantId" IS NULL;

UPDATE "Lead" l
SET "tenantId" = p."tenantId"
FROM "Pipeline" p
WHERE l."pipelineId" = p."id"
    AND l."tenantId" IS NULL;

UPDATE "Lead" l
SET "tenantId" = s."tenantId"
FROM "Stage" s
WHERE l."stageId" = s."id"
    AND l."tenantId" IS NULL;

UPDATE "Lead" SET "tenantId" = 'legacy-tenant' WHERE "tenantId" IS NULL;

UPDATE "Deal" d
SET "tenantId" = l."tenantId"
FROM "Lead" l
WHERE d."leadId" = l."id"
    AND d."tenantId" IS NULL;

UPDATE "Deal" SET "tenantId" = 'legacy-tenant' WHERE "tenantId" IS NULL;

UPDATE "Cadence" SET "tenantId" = 'legacy-tenant' WHERE "tenantId" IS NULL;

UPDATE "CadenceStep" cs
SET "tenantId" = c."tenantId"
FROM "Cadence" c
WHERE cs."cadenceId" = c."id"
    AND cs."tenantId" IS NULL;

UPDATE "CadenceStep" SET "tenantId" = 'legacy-tenant' WHERE "tenantId" IS NULL;

UPDATE "CadenceExecution" ce
SET "tenantId" = c."tenantId"
FROM "Cadence" c
WHERE ce."cadenceId" = c."id"
    AND ce."tenantId" IS NULL;

UPDATE "CadenceExecution" ce
SET "tenantId" = l."tenantId"
FROM "Lead" l
WHERE ce."leadId" = l."id"
    AND ce."tenantId" IS NULL;

UPDATE "CadenceExecution" SET "tenantId" = 'legacy-tenant' WHERE "tenantId" IS NULL;

UPDATE "Message" m
SET "tenantId" = l."tenantId"
FROM "Lead" l
WHERE m."leadId" = l."id"
    AND m."tenantId" IS NULL;

UPDATE "Message" m
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE m."userId" = u."id"
    AND m."tenantId" IS NULL;

UPDATE "Message" SET "tenantId" = 'legacy-tenant' WHERE "tenantId" IS NULL;

UPDATE "Activity" a
SET "tenantId" = l."tenantId"
FROM "Lead" l
WHERE a."leadId" = l."id"
    AND a."tenantId" IS NULL;

UPDATE "Activity" a
SET "tenantId" = u."tenantId"
FROM "User" u
WHERE a."userId" = u."id"
    AND a."tenantId" IS NULL;

UPDATE "Activity" SET "tenantId" = 'legacy-tenant' WHERE "tenantId" IS NULL;

UPDATE "Tag" SET "tenantId" = 'legacy-tenant' WHERE "tenantId" IS NULL;

-- Merge duplicate tags safely before adding tenant-scoped uniqueness
WITH ranked_tags AS (
    SELECT
        "id",
        "tenantId",
        "name",
        MIN("id") OVER (PARTITION BY "tenantId", "name") AS keep_id
    FROM "Tag"
),
duplicate_tags AS (
    SELECT "id", keep_id
    FROM ranked_tags
    WHERE "id" <> keep_id
)
UPDATE "LeadTag" lt
SET "tagId" = dt.keep_id
FROM duplicate_tags dt
WHERE lt."tagId" = dt."id";

DELETE FROM "LeadTag" a
USING "LeadTag" b
WHERE a.ctid < b.ctid
    AND a."leadId" = b."leadId"
    AND a."tagId" = b."tagId";

DELETE FROM "Tag" t
USING (
    SELECT
        "id",
        MIN("id") OVER (PARTITION BY "tenantId", "name") AS keep_id
    FROM "Tag"
) d
WHERE t."id" = d."id"
    AND d."id" <> d.keep_id;

UPDATE "LeadTag" lt
SET "tenantId" = l."tenantId"
FROM "Lead" l
WHERE lt."leadId" = l."id"
    AND lt."tenantId" IS NULL;

UPDATE "LeadTag" lt
SET "tenantId" = t."tenantId"
FROM "Tag" t
WHERE lt."tagId" = t."id"
    AND lt."tenantId" IS NULL;

UPDATE "LeadTag" SET "tenantId" = 'legacy-tenant' WHERE "tenantId" IS NULL;

-- Enforce NOT NULL after backfill
ALTER TABLE "Activity" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Cadence" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "CadenceExecution" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "CadenceStep" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Deal" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Lead" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "LeadTag" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Message" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Pipeline" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Stage" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Tag" ALTER COLUMN "tenantId" SET NOT NULL;

-- Rebuild LeadTag primary key with tenant scope
ALTER TABLE "LeadTag" ADD CONSTRAINT "LeadTag_pkey" PRIMARY KEY ("leadId", "tagId", "tenantId");

-- Replace old global uniques
DROP INDEX IF EXISTS "Tag_name_key";
DROP INDEX IF EXISTS "User_email_key";

-- CreateIndex
CREATE INDEX "Activity_tenantId_idx" ON "Activity"("tenantId");
CREATE INDEX "Cadence_tenantId_idx" ON "Cadence"("tenantId");
CREATE INDEX "CadenceExecution_tenantId_idx" ON "CadenceExecution"("tenantId");
CREATE INDEX "CadenceStep_tenantId_idx" ON "CadenceStep"("tenantId");
CREATE INDEX "Deal_tenantId_idx" ON "Deal"("tenantId");
CREATE INDEX "Lead_tenantId_idx" ON "Lead"("tenantId");
CREATE INDEX "LeadTag_tenantId_idx" ON "LeadTag"("tenantId");
CREATE INDEX "Message_tenantId_idx" ON "Message"("tenantId");
CREATE INDEX "Pipeline_tenantId_idx" ON "Pipeline"("tenantId");
CREATE INDEX "RefreshToken_tenantId_idx" ON "RefreshToken"("tenantId");
CREATE INDEX "Stage_tenantId_idx" ON "Stage"("tenantId");
CREATE INDEX "Tag_tenantId_idx" ON "Tag"("tenantId");
CREATE UNIQUE INDEX "Tag_tenantId_name_key" ON "Tag"("tenantId", "name");
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Pipeline" ADD CONSTRAINT "Pipeline_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Cadence" ADD CONSTRAINT "Cadence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CadenceStep" ADD CONSTRAINT "CadenceStep_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CadenceExecution" ADD CONSTRAINT "CadenceExecution_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LeadTag" ADD CONSTRAINT "LeadTag_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

