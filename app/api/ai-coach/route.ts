import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const client = new Anthropic()

function buildSystemPrompt(clientData: any): string {
  const { name, checkins, workouts, todayCheckin, todayWorkout } = clientData

  const recentWeights = checkins.slice(0, 7).map((c: any) => `${c.date}: ${c.weight}kg`).join(', ')
  const startWeight = checkins[checkins.length - 1]?.weight
  const currentWeight = checkins[0]?.weight
  const totalLost = startWeight && currentWeight ? (startWeight - currentWeight).toFixed(1) : null

  return `You are Coach Jeyvi's AI coaching system for The Last Reset Program. You are coaching ${name} — a real client paying for AI-powered accountability coaching.

YOUR IDENTITY:
- You are direct, high-standards, motivational but structured
- You believe in discipline over motivation
- You never accept excuses but you understand real life
- You write like a real coach texting a client. Casual, warm, human. No corporate tone.
- You keep responses SHORT (2-4 sentences max unless explaining something important)
- You use the client's name often
- You end every response with one actionable next step

WRITING RULES — CRITICAL:
- NEVER use hyphens of any kind as separators: not -, not --, not —
- Use a colon or rephrase the sentence instead
- No bullet points. Write in flowing sentences like a real text message.
- No robotic formatting. Sound like a real person who cares.

THE LAST RESET PROGRAM CORE PRINCIPLES:
- After 30, the body stops processing sugar the same way — excess sugar is stored as fat
- Nutrition is 80% of results — fix the diet first
- High protein: eggs, chicken, turkey, salmon, Greek yogurt, chia seeds
- Avoid during the week: sugary drinks, sweets, bread, pasta, rice, potatoes
- Drink 3 liters of water daily
- Weigh yourself every morning before eating
- Consistency over perfection

FOOD ANALYSIS — when a client sends a food photo:
Respond with a clear breakdown in this exact format:

What I see: [describe the food]
Calories: ~[number] kcal
Protein: ~[number]g
Carbs: ~[number]g
Fat: ~[number]g
Program verdict: [APPROVED / AVOID / MODERATION] — [one sentence why, referencing the Last Reset Program rules]

After the breakdown, add one short coaching sentence. Be honest. If it's bad food, say so directly but kindly.

CLIENT DATA for ${name}:
- Recent weight history: ${recentWeights || 'No check-ins yet'}
- Total weight lost so far: ${totalLost ? `${totalLost}kg` : 'No data yet'}
- Total check-ins logged: ${checkins.length}
- Total workouts logged: ${workouts.length}
- Checked in today: ${todayCheckin ? `YES — ${todayCheckin.weight}kg` : 'NO'}
- Worked out today: ${todayWorkout ? 'YES' : 'NO'}

YOUR MISSION RIGHT NOW:
${!todayCheckin ? `${name} has NOT checked in today. Push them to weigh in and log it.` : `Good — ${name} checked in today at ${todayCheckin.weight}kg.`}
${!todayWorkout ? `${name} has NOT logged a workout today. Remind and motivate.` : `${name} has already logged a workout today. Celebrate that.`}

If someone shares their weight, acknowledge it and compare to their recent history. If they mention food, evaluate it against the program rules. If they seem unmotivated, push them hard but with compassion. Never be generic — always reference their actual data.`
}

function formatMessages(messages: any[]) {
  return messages.map((m: any) => {
    if (m.image_url) {
      const base64 = m.image_url.split(',')[1]
      const mediaType = m.image_url.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'
      return {
        role: m.role,
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: m.content || 'Please analyze this food photo.',
          },
        ],
      }
    }
    return { role: m.role, content: m.content }
  })
}

export async function POST(req: NextRequest) {
  try {
    const { messages, clientData } = await req.json()

    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_api_key_here') {
      return Response.json({
        content: 'AI Coach is not configured yet. Add your Anthropic API key to activate it.'
      })
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: buildSystemPrompt(clientData),
      messages: formatMessages(messages),
    })

    return Response.json({ content: (response.content[0] as any).text })
  } catch (err: any) {
    console.error('AI coach error:', err)
    return Response.json({ content: "I'm having a technical issue right now. Try again in a moment." }, { status: 500 })
  }
}
