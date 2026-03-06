const bcrypt = require('bcryptjs');
const { PrismaClient, ApplicationStatus, UserRole } = require('@prisma/client');

const prisma = new PrismaClient();

async function upsertStudent(data) {
  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.upsert({
    where: { email: data.email },
    update: {
      name: data.name,
      role: UserRole.STUDENT,
      passwordHash,
    },
    create: {
      name: data.name,
      email: data.email,
      role: UserRole.STUDENT,
      passwordHash,
    },
  });

  await prisma.student.upsert({
    where: { userId: user.id },
    update: {
      major: data.major,
      graduationYear: data.graduationYear,
    },
    create: {
      userId: user.id,
      major: data.major,
      graduationYear: data.graduationYear,
    },
  });

  return user;
}

async function upsertAdmin(data) {
  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.upsert({
    where: { email: data.email },
    update: {
      name: data.name,
      role: UserRole.ADMIN,
      passwordHash,
    },
    create: {
      name: data.name,
      email: data.email,
      role: UserRole.ADMIN,
      passwordHash,
    },
  });

  await prisma.admin.upsert({
    where: { adminId: data.adminId },
    update: { userId: user.id },
    create: {
      userId: user.id,
      adminId: data.adminId,
    },
  });
}

async function seedApplications(studentUserId) {
  const items = [
    {
      companyName: 'TechCorp',
      jobRole: 'Frontend Developer',
      status: ApplicationStatus.INTERVIEW,
      applicationDate: new Date('2024-03-01'),
      notes: 'Strong focus on React and Tailwind.',
    },
    {
      companyName: 'DataFlow',
      jobRole: 'Software Engineer',
      status: ApplicationStatus.APPLIED,
      applicationDate: new Date('2024-03-05'),
      notes: 'Applied via internal referral.',
    },
    {
      companyName: 'CloudScale',
      jobRole: 'Fullstack Engineer',
      status: ApplicationStatus.SCREENING_CALL,
      applicationDate: new Date('2024-02-28'),
    },
    {
      companyName: 'InnovateAI',
      jobRole: 'AI Research Intern',
      status: ApplicationStatus.REJECTED,
      applicationDate: new Date('2024-02-15'),
    },
    {
      companyName: 'FinTech Solutions',
      jobRole: 'Backend Developer',
      status: ApplicationStatus.OFFER,
      applicationDate: new Date('2024-02-10'),
    },
  ];

  for (const item of items) {
    await prisma.application.upsert({
      where: {
        studentUserId_companyName_jobRole: {
          studentUserId,
          companyName: item.companyName,
          jobRole: item.jobRole,
        },
      },
      update: {
        status: item.status,
        applicationDate: item.applicationDate,
        notes: item.notes || null,
      },
      create: {
        studentUserId,
        companyName: item.companyName,
        jobRole: item.jobRole,
        status: item.status,
        applicationDate: item.applicationDate,
        notes: item.notes || null,
      },
    });
  }
}

async function main() {
  const primaryStudent = await upsertStudent({
    name: 'Alex Johnson',
    email: 'alex.j@example.com',
    major: 'Computer Science',
    graduationYear: 2025,
    password: 'password',
  });

  await upsertStudent({
    name: 'Sarah Smith',
    email: 'sarah.s@example.com',
    major: 'Data Science',
    graduationYear: 2024,
    password: 'password',
  });

  await upsertAdmin({
    name: 'Jane Smith',
    email: 'jane.admin@example.com',
    adminId: 'ADM001',
    password: 'admin',
  });

  await upsertAdmin({
    name: 'Robert Brown',
    email: 'robert.admin@example.com',
    adminId: 'ADM002',
    password: 'admin',
  });

  await seedApplications(primaryStudent.id);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Seeding complete.');
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
