import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Base city for simulated drivers (Manila). Riders can request anywhere.
const CITY = { lat: 14.5995, lng: 120.9842 };
const rand = (v: number, amt: number) => v + (Math.random() - 0.5) * amt;

const SIM_DRIVERS = [
  { name: 'Miguel Santos', model: 'Toyota Vios', plate: 'CRB-101', color: 'Silver' },
  { name: 'Aisha Rahman', model: 'Honda City', plate: 'CRB-202', color: 'White' },
  { name: 'Deng Wei', model: 'Mitsubishi Mirage', plate: 'CRB-303', color: 'Red' },
  { name: 'Priya Nair', model: 'Suzuki Ertiga', plate: 'CRB-404', color: 'Blue' },
  { name: 'Carlos Reyes', model: 'Toyota Avanza', plate: 'CRB-505', color: 'Grey' },
  { name: 'Linh Tran', model: 'Hyundai Accent', plate: 'CRB-606', color: 'Black' },
];

async function main() {
  const pw = await bcrypt.hash('password123', 10);

  // Demo rider.
  await prisma.user.upsert({
    where: { email: 'rider@crab.dev' },
    update: {},
    create: {
      email: 'rider@crab.dev',
      passwordHash: pw,
      name: 'Riza Rider',
      phone: '+63 900 000 0001',
      role: 'RIDER',
      wallet: { create: { balance: 120 } },
    },
  });

  // Demo human driver (usable in a second browser window).
  await prisma.user.upsert({
    where: { email: 'driver@crab.dev' },
    update: {},
    create: {
      email: 'driver@crab.dev',
      passwordHash: pw,
      name: 'Dan Driver',
      phone: '+63 900 000 0002',
      role: 'DRIVER',
      wallet: { create: { balance: 40 } },
      driver: {
        create: {
          vehicleModel: 'Toyota Innova',
          plate: 'CRB-777',
          color: 'Pearl White',
          seats: 6,
          lat: CITY.lat,
          lng: CITY.lng,
        },
      },
    },
  });

  // Simulated fleet.
  for (let i = 0; i < SIM_DRIVERS.length; i++) {
    const d = SIM_DRIVERS[i];
    const email = `sim${i + 1}@crab.dev`;
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: pw,
        name: d.name,
        role: 'DRIVER',
        ratingAvg: Math.round((4.5 + Math.random() * 0.5) * 100) / 100,
        ratingCount: 20 + Math.floor(Math.random() * 200),
        wallet: { create: { balance: 30 } },
        driver: {
          create: {
            vehicleModel: d.model,
            plate: d.plate,
            color: d.color,
            seats: 4,
            isSimulated: true,
            isOnline: true,
            lat: rand(CITY.lat, 0.05),
            lng: rand(CITY.lng, 0.05),
          },
        },
      },
    });
  }

  console.log('✅ Seeded demo users:');
  console.log('   rider@crab.dev  / password123  (rider)');
  console.log('   driver@crab.dev / password123  (driver)');
  console.log(`   + ${SIM_DRIVERS.length} simulated drivers`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
