// ============================================================
// prisma/seed.ts - SaaS Engine Pro
// ============================================================

import {
  PrismaClient,
  Role,
  PlanTier,
  AuditAction,
  AuditEntityType,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface SeedResult {
  founderId: string;
  moduleIds: string[];
}

async function main(): Promise<SeedResult> {
  console.log('🌱 Starting seed...\n');

  // ============================================================
  // 1. SEED FOUNDER ADMIN
  // ============================================================
  const founderEmail = 'founder@saasengine.pro';

  // Use env var in production, fallback for dev only
  const plainPassword = process.env.FOUNDER_INITIAL_PASSWORD || 'changeme123';

  if (!process.env.FOUNDER_INITIAL_PASSWORD && process.env.NODE_ENV === 'production') {
    throw new Error('❌ FOUNDER_INITIAL_PASSWORD must be set in production');
  }

  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const founder = await prisma.user.upsert({
    where: { email: founderEmail },
    update: {
      role: Role.FOUNDER,
      plan: PlanTier.ENTERPRISE,
      passwordHash,
    },
    create: {
      email: founderEmail,
      passwordHash,
      role: Role.FOUNDER,
      plan: PlanTier.ENTERPRISE,
    },
  });

  console.log('✅ Seeded founder admin:', founderEmail);

  // Audit the founder creation (only if newly created)
  const existingFounderAudit = await prisma.auditLog.findFirst({
    where: {
      entityType: AuditEntityType.USER,
      entityId: founder.id,
      action: AuditAction.USER_CREATED,
    },
  });

  if (!existingFounderAudit) {
    await prisma.auditLog.create({
      data: {
        action: AuditAction.USER_CREATED,
        entityType: AuditEntityType.USER,
        entityId: founder.id,
        performedByUserId: founder.id, // Self-created via seed
        metadata: {
          source: 'seed',
          email: founderEmail,
          role: Role.FOUNDER,
          plan: PlanTier.ENTERPRISE,
        },
      },
    });
    console.log('✅ Audited founder creation');
  }

    // ============================================================
  // 2. SEED DEMO MODULES (for testing governance flow)
  // ============================================================
  type DemoModuleSeed = {
    key: string;
    name: string;
    slug: string;
    description: string;
    minPlan: PlanTier;
  };

  const demoModules: DemoModuleSeed[] = [
    {
      key: 'USER_MANAGEMENT',
      name: 'User Management',
      slug: 'user-management',
      description: 'Core user CRUD operations with role-based access',
      minPlan: PlanTier.FREE,
    },
    {
      key: 'ANALYTICS_DASHBOARD',
      name: 'Analytics Dashboard',
      slug: 'analytics-dashboard',
      description: 'Real-time metrics and reporting for your SaaS',
      minPlan: PlanTier.PRO,
    },
    {
      key: 'AI_CONTENT_GENERATOR',
      name: 'AI Content Generator',
      slug: 'ai-content-generator',
      description: 'AI-powered content creation with governance controls',
      minPlan: PlanTier.ENTERPRISE,
    },
  ];

  const moduleIds: string[] = [];

  for (const moduleData of demoModules) {
    // Check if this module+version combo already exists
    const existing = await prisma.module.findUnique({
      where: {
        slug_version: {
          slug: moduleData.slug,
          version: 1,
        },
      },
    });

    if (existing) {
      console.log(`⏭️  Module already exists: ${moduleData.name}`);
      moduleIds.push(existing.id);
      continue;
    }

    const module = await prisma.module.create({
      data: {
        key: moduleData.key,
        name: moduleData.name,
        slug: moduleData.slug,
        description: moduleData.description,
        minPlan: moduleData.minPlan,
        version: 1,
        isArchived: false,
        publishedAt: new Date(),
        publishedByUserId: founder.id,
      },
    });

    moduleIds.push(module.id);

    // Audit the module creation
    await prisma.auditLog.create({
      data: {
        action: AuditAction.MODULE_CREATED,
        entityType: AuditEntityType.MODULE,
        entityId: module.id,
        performedByUserId: founder.id,
        metadata: {
          source: 'seed',
          name: module.name,
          slug: module.slug,
          version: module.version,
          minPlan: module.minPlan,
          key: module.key,
        },
      },
    });

    console.log(`✅ Seeded module: ${moduleData.name} (${moduleData.minPlan})`);
  }

  // ============================================================
  // 3. SEED DEMO AI DRAFT (for testing approval flow)
  // ============================================================
  const existingDraft = await prisma.aIModuleDraft.findFirst({
    where: { title: 'Billing & Invoicing' },
  });

  if (!existingDraft) {
    const demoDraft = await prisma.aIModuleDraft.create({
      data: {
        title: 'Billing & Invoicing',
        description:
          'AI-generated module for subscription billing, invoice generation, and payment tracking',
        status: 'PENDING',
        createdByUserId: founder.id,
        schemaPreview: {
          models: ['Invoice', 'Payment', 'Subscription'],
          relations: ['Invoice -> User', 'Payment -> Invoice'],
        },
        routesPreview: {
          endpoints: [
            'POST /api/invoices',
            'GET /api/invoices/:id',
            'POST /api/payments',
            'GET /api/subscriptions/:userId',
          ],
        },
        permissionsPreview: {
          minPlan: 'PRO',
          requiredRoles: ['USER', 'ADMIN', 'FOUNDER'],
        },
      },
    });

    console.log(`✅ Seeded AI draft: ${demoDraft.title} (PENDING approval)`);
  } else {
    console.log('⏭️  AI draft already exists: Billing & Invoicing');
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n🎉 Seed complete!');
  console.log('─'.repeat(50));
  console.log(`   Founder: ${founderEmail}`);
  console.log(
    `   Password: ${
      process.env.FOUNDER_INITIAL_PASSWORD ? '(from env)' : plainPassword
    }`
  );
  console.log(`   Modules: ${moduleIds.length} seeded`);
  console.log('─'.repeat(50));
  console.log('\n⚠️  Remember to change the founder password after first login!\n');

  return { founderId: founder.id, moduleIds };
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
