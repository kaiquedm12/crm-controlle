import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rls = await prisma.$queryRawUnsafe<Array<{ table_name: string; rls_enabled: boolean }>>(`
    SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN (
        'Tenant', 'User', 'Pipeline', 'Stage', 'Lead', 'Deal', 'Message',
        'Activity', 'Cadence', 'CadenceStep', 'CadenceExecution', 'Tag',
        'LeadTag', 'RefreshToken'
      )
    ORDER BY c.relname;
  `);

  const policies = await prisma.$queryRawUnsafe<Array<{ tablename: string; policyname: string }>>(`
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'Tenant', 'User', 'Pipeline', 'Stage', 'Lead', 'Deal', 'Message',
        'Activity', 'Cadence', 'CadenceStep', 'CadenceExecution', 'Tag',
        'LeadTag', 'RefreshToken'
      )
    ORDER BY tablename, policyname;
  `);

  const missingRls = rls.filter((row) => !row.rls_enabled).map((row) => row.table_name);

  console.log('RLS status by table:');
  console.table(rls);
  console.log('Policy count:', policies.length);
  console.log('First policies sample:', policies.slice(0, 10));

  if (missingRls.length > 0) {
    throw new Error(`RLS is disabled on: ${missingRls.join(', ')}`);
  }

  const requiredPolicyCount = 14;
  if (policies.length < requiredPolicyCount) {
    throw new Error(`Expected at least ${requiredPolicyCount} policies, found ${policies.length}`);
  }

  console.log('RLS validation passed.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
