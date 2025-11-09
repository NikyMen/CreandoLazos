import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function ensureUser(role: 'ADMIN' | 'PATIENT', email: string, password: string) {
  const existingByRole = await prisma.user.findFirst({ where: { role } });
  const passwordHash = await bcrypt.hash(password, 10);

  if (existingByRole) {
    if (existingByRole.email !== email) {
      const otherWithEmail = await prisma.user.findUnique({ where: { email } });
      if (otherWithEmail && otherWithEmail.id !== existingByRole.id) {
        await prisma.user.delete({ where: { id: otherWithEmail.id } });
        console.log(`Eliminado usuario duplicado con email ${email}`);
      }
    }
    await prisma.user.update({
      where: { id: existingByRole.id },
      data: { email, passwordHash },
    });
    console.log(`${role} actualizado: ${email}`);
  } else {
    await prisma.user.create({
      data: { email, passwordHash, role },
    });
    console.log(`${role} creado: ${email}`);
  }
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@creandolazos.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const patientEmail = process.env.PATIENT_EMAIL || 'paciente@creandolazos.local';
  const patientPassword = process.env.PATIENT_PASSWORD || 'Paciente123!';

  await ensureUser('ADMIN', adminEmail, adminPassword);
  await ensureUser('PATIENT', patientEmail, patientPassword);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });