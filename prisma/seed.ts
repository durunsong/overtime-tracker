import { getPrisma } from "@/lib/prisma";
import { defaultWorkRule } from "@/types/attendance";

const demoUserEmail = process.env.SEED_DEMO_EMAIL?.trim() || "demo@example.com";
const demoUserName = process.env.SEED_DEMO_NAME?.trim() || "Demo User";

async function main() {
  const prisma = getPrisma();
  const user = await prisma.user.upsert({
    where: { email: demoUserEmail },
    update: { name: demoUserName },
    create: {
      name: demoUserName,
      email: demoUserEmail,
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
