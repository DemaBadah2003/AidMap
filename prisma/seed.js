// استبدل السطر الأول القديم بهذا السطر
const { PrismaClient } = require('@prisma/client');

// تأكد من أن التعريف يتم هكذا بدون باراميترز فارغة أو غريبة
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
  console.log('Cleaning and Seeding...');

  // 1. تنظيف الجداول القديمة لضمان عدم وجود تكرار أو تعارض في البيانات
  await prisma.user.deleteMany({});
  await prisma.userRole.deleteMany({});

  // 2. إنشاء الأدوار (Roles)
  // تم ضبط "citizen" كدور افتراضي (isDefault: true) كما في طلباتك السابقة
  const adminRole = await prisma.userRole.create({
    data: {
      slug: 'admin',
      name: 'ADMIN',
      description: 'مدير النظام',
      isDefault: false,
    },
  });

  const citizenRole = await prisma.userRole.create({
    data: {
      slug: 'citizen',
      name: 'CITIZEN',
      description: 'مواطن عادي',
      isDefault: true, 
    },
  });

  // 3. تجهيز كلمات المرور المشفرة
  const adminPasswordHash = await bcrypt.hash('Ahmed12345678@', 10);
  const userPasswordHash = await bcrypt.hash('Dema12345678@', 10);

  // 4. إنشاء حساب الأدمن (Admin)
  await prisma.user.create({
    data: {
      email: 'ahmed4@gmail.com',
      name: 'Ahmed Admin',
      password: adminPasswordHash,
      roleId: adminRole.id, // الربط مع دور المدير
      status: 'ACTIVE',     // الحساب مفعل مباشرة
    },
  });

  // 5. إنشاء حساب المستخدم (Citizen)
  await prisma.user.create({
    data: {
      email: 'dema4@gmail.com',
      name: 'Dema User',
      password: userPasswordHash,
      roleId: citizenRole.id, // الربط مع دور المواطن
      status: 'ACTIVE',      // الحساب مفعل مباشرة
    },
  });

  console.log('Done! Admin and User accounts have been created successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });