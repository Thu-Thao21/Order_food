const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function inferLabelFromRecord(rec) {
  if (!rec) return null;
  if (rec.tableName && rec.tableName.trim()) return rec.tableName.trim();

  if (rec.tableId) {
    try {
      const t = await prisma.table.findUnique({ where: { id: rec.tableId } });
      if (t && t.name) return t.name;
    } catch (e) {
      // ignore lookup errors
    }
  }

  const text = (rec.message || rec.note || '').toString();
  const prefix = text.split(' - ')[0].trim();
  if (prefix.startsWith('Bàn ')) return prefix;

  return null;
}

async function backfillModel(modelName, findFn, updateFn) {
  console.log(`\nBackfilling ${modelName}...`);
  const items = await findFn();
  console.log(`Found ${items.length} ${modelName} records to inspect.`);
  let updated = 0;
  for (const it of items) {
    try {
      const label = await inferLabelFromRecord(it);
      if (label) {
        await updateFn(it.id, label);
        updated++;
        console.log(`Updated ${modelName} #${it.id} -> "${label}"`);
      }
    } catch (e) {
      console.error(`Error updating ${modelName} #${it.id}:`, e.message || e);
    }
  }
  console.log(`Updated ${updated}/${items.length} ${modelName} records.`);
}

async function main() {
  try {
    // PaymentRequests
    await backfillModel(
      'PaymentRequest',
      () => prisma.paymentRequest.findMany({ where: { OR: [{ tableName: null }, { tableName: '' }] } }),
      (id, label) => prisma.paymentRequest.update({ where: { id }, data: { tableName: label } })
    );

    // StaffCalls
    await backfillModel(
      'StaffCall',
      () => prisma.staffCall.findMany({ where: { OR: [{ tableName: null }, { tableName: '' }] } }),
      (id, label) => prisma.staffCall.update({ where: { id }, data: { tableName: label } })
    );

    // Ratings
    await backfillModel(
      'Rating',
      () => prisma.rating.findMany({ where: { OR: [{ tableName: null }, { tableName: '' }] } }),
      (id, label) => prisma.rating.update({ where: { id }, data: { tableName: label } })
    );

    console.log('\nBackfill complete.');
  } catch (e) {
    console.error('Backfill failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
