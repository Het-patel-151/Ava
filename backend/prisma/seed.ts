import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminPw = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ava.local' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@ava.local',
      password: adminPw,
      role: 'ADMIN',
      emailVerified: true,
      settings: { create: {} },
      subscription: { create: { plan: 'ENTERPRISE' } },
    },
  });

  const demoPw = await bcrypt.hash('Demo@123456', 12);
  const demo = await prisma.user.upsert({
    where: { email: 'demo@ava.local' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@ava.local',
      password: demoPw,
      role: 'USER',
      emailVerified: true,
      bio: 'Exploring free local AI',
      location: 'Localhost',
      settings: { create: { theme: 'dark', voiceEnabled: true, ollamaModel: 'llama3.2' } },
      subscription: { create: { plan: 'PRO' } },
    },
  });

  // Default agents — all use free Ollama models
  const agents = [
    { name: 'AVA Assistant',    model: 'llama3_2' as const, description: 'General-purpose assistant',        systemPrompt: 'You are AVA, a helpful, honest AI assistant. Be concise and friendly.', personality: 'helpful',    isDefault: true },
    { name: 'Code Expert',      model: 'llama3_2' as const, description: 'Software engineer & debugger',     systemPrompt: 'You are an expert software engineer. Help with code, debugging, and architecture. Always provide working examples.',  personality: 'precise',    isDefault: true },
    { name: 'Research Scholar', model: 'llama3_2' as const, description: 'Analytical research assistant',    systemPrompt: 'You are a meticulous researcher. Provide structured, comprehensive analysis with clear explanations.',              personality: 'analytical', isDefault: true },
    { name: 'Creative Writer',  model: 'llama3_2' as const, description: 'Storyteller & writing coach',      systemPrompt: 'You are a creative writing expert. Help craft stories, poems, scripts, and marketing copy in any style.',           personality: 'creative',   isDefault: true },
    { name: 'Business Coach',   model: 'llama3_2' as const, description: 'Strategy & productivity advisor',  systemPrompt: 'You are an experienced business coach. Give actionable advice on strategy, productivity, and entrepreneurship.',    personality: 'strategic',  isDefault: true },
    { name: 'Language Tutor',   model: 'llama3_2' as const, description: 'Patient multilingual tutor',       systemPrompt: 'You are a patient language tutor. Help users learn languages through conversation, grammar, and vocabulary.',        personality: 'patient',    isDefault: true },
  ];

  for (const a of agents) {
    await prisma.agent.upsert({
      where: { id: a.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: { id: a.name.toLowerCase().replace(/\s+/g, '-'), ...a, isPublic: true, userId: admin.id },
    });
    console.log(`✅ Agent: ${a.name}`);
  }

  // Sample conversation
  await prisma.conversation.create({
    data: {
      title: 'Welcome to AVA',
      userId: demo.id,
      isStarred: true,
      messages: {
        create: [
          { userId: demo.id, role: 'user',      content: 'Hello! What can you do?', type: 'TEXT' },
          { userId: demo.id, role: 'assistant', content: "Hi! I'm AVA, your local AI assistant — running 100% free on your machine.\n\nI can help you with:\n- **Writing & editing**\n- **Coding & debugging**\n- **Research & analysis**\n- **Voice conversations** (tap the mic!)\n\nAll powered by Ollama + Llama 3.2, with no API keys or fees. What would you like to explore?", type: 'TEXT' },
        ],
      },
    },
  });

  // Seed 14 days of analytics
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    await prisma.analytics.upsert({
      where: { userId_date: { userId: demo.id, date } },
      update: {},
      create: {
        userId: demo.id, date,
        conversations: Math.floor(Math.random() * 5) + 1,
        messages:      Math.floor(Math.random() * 20) + 5,
        voiceSessions: Math.floor(Math.random() * 3),
        tokensUsed:    Math.floor(Math.random() * 5000) + 500,
      },
    });
  }

  await prisma.notification.create({
    data: { userId: demo.id, title: 'Welcome to AVA!', message: 'Your 100% free AI assistant is ready. Everything runs locally — no API keys needed!', type: 'SUCCESS' },
  });

  console.log('\n🎉 Seed complete!\n');
  console.log('Login with:  demo@ava.local / Demo@123456');
  console.log('Admin:       admin@ava.local / Admin@123456\n');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
