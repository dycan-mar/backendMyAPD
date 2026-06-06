const prisma = require('./src/config/prisma');

async function main() {
  await prisma.transaction.deleteMany();
  console.log("All transactions deleted to allow migration.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
