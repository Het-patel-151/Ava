import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ava.app' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@ava.app',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: true,
      settings: { create: {} },
      subscription: { create: { plan: 'ENTERPRISE', status: 'active' } },
    },
  });
  console.log('✅ Admin user:', admin.email);

  // Create demo user
  const userPassword = await bcrypt.hash('Demo@123456', 12);
  const demo = await prisma.user.upsert({
    where: { email: 'demo@ava.app' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@ava.app',
      password: userPassword,
      role: 'USER',
      emailVerified: true,
      bio: 'Exploring AI voice assistants',
      location: 'San Francisco, CA',
      settings: {
        create: {
          theme: 'dark',
          voiceEnabled: true,
          voiceId: 'nova',
          notificationsEnabled: true,
        },
      },
      subscription: { create: { plan: 'PRO', status: 'active' } },
    },
  });
  console.log('✅ Demo user:', demo.email);

  // Create default public agents
  const agents = [
    {
      name: 'AVA Assistant',
      description: 'General-purpose AI assistant',
      systemPrompt: 'You are AVA, a helpful, harmless, and honest AI assistant. You provide clear, concise, and accurate responses. Be friendly and professional.',
      personality: 'helpful',
      isPublic: true,
      isDefault: true,
    },
    {
      name: 'Code Expert',
      description: 'Expert software engineer and debugger',
      systemPrompt: 'You are an expert software engineer with deep knowledge of multiple programming languages and frameworks. Help with code, debugging, architecture, and best practices. Always provide working code examples and explain your reasoning.',
      personality: 'precise',
      isPublic: true,
      isDefault: true,
    },
    {
      name: 'Research Scholar',
      description: 'Deep analytical research assistant',
      systemPrompt: 'You are a meticulous research assistant with expertise across academic domains. Provide well-structured, comprehensive analysis with clear citations when possible. Break down complex topics into digestible explanations.',
      personality: 'analytical',
      isPublic: true,
      isDefault: true,
    },
    {
      name: 'Creative Writer',
      description: 'Imaginative storyteller and writing coach',
      systemPrompt: 'You are a talented creative writer and writing coach. Help craft compelling stories, poems, scripts, and marketing copy. Adapt to any genre or style. Offer constructive feedback and creative suggestions.',
      personality: 'creative',
      isPublic: true,
      isDefault: true,
    },
    {
      name: 'Business Coach',
      description: 'Strategic business and productivity advisor',
      systemPrompt: 'You are an experienced business coach and strategic advisor. Help with business planning, productivity, leadership, marketing, and entrepreneurship. Provide actionable, practical advice tailored to the situation.',
      personality: 'strategic',
      isPublic: true,
      isDefault: true,
    },
    {
      name: 'Language Tutor',
      description: 'Patient multilingual language teacher',
      systemPrompt: 'You are a patient and encouraging language tutor fluent in many languages. Help users learn new languages through conversation, grammar explanations, vocabulary building, and cultural context. Adapt to the learner\'s level.',
      personality: 'patient',
      isPublic: true,
      isDefault: true,
    },
  ];

  for (const agentData of agents) {
    const agent = await prisma.agent.upsert({
      where: { id: agentData.name.toLowerCase().replace(/\s/g, '-') },
      update: {},
      create: {
        id: agentData.name.toLowerCase().replace(/\s/g, '-'),
        ...agentData,
        model: 'gpt-4o',
        userId: admin.id,
      },
    });
    console.log('✅ Agent:', agent.name);
  }

  // Create sample conversations for demo user
  const conversation = await prisma.conversation.create({
    data: {
      title: 'Getting started with AVA',
      userId: demo.id,
      isStarred: true,
      messages: {
        create: [
          {
            userId: demo.id,
            role: 'user',
            content: 'Hello! What can you help me with?',
            type: 'TEXT',
          },
          {
            userId: demo.id,
            role: 'assistant',
            content: "Hello! I'm AVA, your AI assistant. I can help you with a wide range of tasks:\n\n- **Writing & editing** — drafts, emails, essays\n- **Coding** — debugging, code review, new features\n- **Research** — analysis, summarization, fact-checking\n- **Brainstorming** — ideas, plans, strategies\n- **Voice conversations** — just tap the mic!\n\nWhat would you like to explore today?",
            type: 'TEXT',
          },
        ],
      },
    },
  });
  console.log('✅ Sample conversation created:', conversation.id);

  // Seed analytics data (last 14 days)
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    await prisma.analytics.upsert({
      where: { userId_date: { userId: demo.id, date } },
      update: {},
      create: {
        userId: demo.id,
        date,
        conversations: Math.floor(Math.random() * 5) + 1,
        messages: Math.floor(Math.random() * 20) + 5,
        voiceSessions: Math.floor(Math.random() * 3),
        tokensUsed: Math.floor(Math.random() * 5000) + 500,
        sessionDuration: Math.floor(Math.random() * 30) + 5,
      },
    });
  }
  console.log('✅ Analytics seeded for 14 days');

  // Welcome notification
  await prisma.notification.create({
    data: {
      userId: demo.id,
      title: 'Welcome to AVA!',
      message: 'Your AI voice assistant is ready. Try starting a voice conversation or chat with one of our AI agents.',
      type: 'SUCCESS',
    },
  });
  console.log('✅ Welcome notification created');

  console.log('\n🎉 Seed complete!\n');
  console.log('Demo credentials:');
  console.log('  Email:    demo@ava.app');
  console.log('  Password: Demo@123456\n');
  console.log('Admin credentials:');
  console.log('  Email:    admin@ava.app');
  console.log('  Password: Admin@123456\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
