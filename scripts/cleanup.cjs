const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  // Find the test customer
  const test = await db.customer.findFirst({ where: { phone: '+919999999999' } });
  if (test) {
    await db.milkEntry.deleteMany({ where: { customerId: test.id } });
    await db.activityLog.deleteMany({ where: { customerId: test.id } });
    await db.customer.delete({ where: { id: test.id } });
    console.log('Test customer cleaned up');
  } else {
    console.log('No test customer found');
  }
})();
