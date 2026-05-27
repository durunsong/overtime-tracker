import { getPrisma } from "@/lib/prisma";
import { defaultWorkRule } from "@/types/attendance";

async function main() {
  const prisma = getPrisma();
  const user = await prisma.user.upsert({
    where: { email: "durunsongs@gmail.com" },
    update: { name: "Durun Songs" },
    create: {
      name: "Durun Songs",
      email: "durunsongs@gmail.com",
      avatar: "https://api.dicebear.com/9.x/initials/svg?seed=OT",
    },
  });

  await prisma.workRule.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  await prisma.workRule.create({ data: { ...defaultWorkRule, userId: user.id } });

  console.log(`已初始化默认用户与默认工作规则：${user.email}`);
}

main()
  .then(async () => {
    await getPrisma().$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await getPrisma().$disconnect();
    process.exit(1);
  });
