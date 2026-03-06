import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@tinban.com" },
    update: {},
    create: {
      email: "admin@tinban.com",
      passwordHash: hash,
      name: "Administrador",
      role: "ADMIN",
      creditApproved: true,
    },
  });
  console.log("Admin user:", admin.email);

  await prisma.category.upsert({
    where: { slug: "general" },
    update: {},
    create: { description: "General", slug: "general", sortOrder: 0 },
  });

  // Atributos por defecto (opcionales en cada subasta)
  const defaultAttrs = [
    { key: "estado", label: "Estado", type: "text", sortOrder: 0 },
    { key: "cantidad", label: "Cantidad", type: "text", sortOrder: 1 },
    { key: "medidas", label: "Medidas", type: "text", sortOrder: 2 },
    { key: "condicion", label: "Condición", type: "text", sortOrder: 3 },
    { key: "calidad", label: "Calidad", type: "text", sortOrder: 4 },
    { key: "uso", label: "Uso", type: "text", sortOrder: 5 },
  ];
  for (const a of defaultAttrs) {
    await prisma.dynamicAttributeDef.upsert({
      where: { key: a.key },
      update: {},
      create: a,
    });
  }
  console.log("Seed OK");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
