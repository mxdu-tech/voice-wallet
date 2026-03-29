import OpenAI from "openai"
import type { Intent } from '@/lib/types/intent'

type AIProvider = 'openai' | 'deepseek'
const provider = (import.meta.env.VITE_AI_PROVIDER || 'deepseek') as AIProvider

function getClient() {
    if (provider == 'deepseek'){
        return new OpenAI({
            apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
            baseURL: 'https://api.deepseek.com',
            dangerouslyAllowBrowser: true,
        })
    }
    return new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
    })
}



function getModel(){
    if (provider == 'deepseek'){
        return 'deepseek-chat'
    }
    return 'gpt-4.1-mini'
}


function buildSystemPrompt() {
	return `
    You are a strict JSON parser for crypto wallet commands.

    IMPORTANT:
    - Output ONLY valid JSON
    - Do NOT include explanation
    - Do NOT include markdown
    - Do NOT include text before or after JSON

    Schema:
    {
    "action": "send" | "balance" | "unknown",
    "amount": string | undefined,
    "token": string | undefined,
    "to": string | undefined,
    "raw": string
    }

    Examples:
    User: send 0.01 ETH to alice
    Output:
    {"action":"send","amount":"0.01","token":"ETH","to":"alice","raw":"send 0.01 ETH to alice"}

    User: check my balance
    Output:
    {"action":"balance","raw":"check my balance"}

    If unsure:
    {"action":"unknown","raw":"<original input>"}
    `.trim()
}

function extractJSON(text: string): string | null {
	const match = text.match(/\{[\s\S]*\}/)
	return match ? match[0] : null
}

export async function parseIntentWithAI(input: string): Promise<Intent> {
	if (!input.trim()) {
		return {
			action: 'unknown',
			raw: input,
		}
	}

	const client = getClient()
	const model = getModel()
	const systemPrompt = buildSystemPrompt()

	try {
		const response = await client.chat.completions.create({
			model,
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: input },
			],
			temperature: 0,
			response_format: { type: 'json_object' },
		})

		const text = response.choices[0]?.message?.content?.trim()
		console.log(`[AI:${provider}] raw response:`, text)

		if (!text) {
			return {
				action: 'unknown',
				raw: input,
			}
		}

		const jsonString = extractJSON(text) || text
		const parsed = JSON.parse(jsonString) as Intent

		return {
			action: parsed.action ?? 'unknown',
			amount: parsed.amount,
			token: parsed.token,
			to: parsed.to,
			raw: parsed.raw ?? input,
		}
	} catch (error) {
		console.error(`[AI:${provider}] parsing failed:`, error)

		return {
			action: 'unknown',
			raw: input,
		}
	}
}