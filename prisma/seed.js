const prisma = require("../src/config/prisma");
const bcrypt = require("bcrypt");

async function main() {
  const adminNid = "admin123";
  const existingAdmin = await prisma.user.findUnique({
    where: { nid: adminNid },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("password123", 10);
    const admin = await prisma.user.create({
      data: {
        nid: adminNid,
        password: hashedPassword,
        role: "admin",
      },
    });
    console.log("Admin account created! NID: admin123 | Password: password123");
  } else {
    console.log("Admin account already exists.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
