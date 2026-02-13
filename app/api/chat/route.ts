
import { streamText } from 'ai';
import { getModel } from '@/lib/ai/config';
import { initialSystemPrompt } from '@/lib/ai/prompts';
import { getAISettings } from '@/lib/actions/settings';
import { getServerSession } from "@/lib/session";
import { createTools } from '@/lib/ai/tools';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    console.log("POST /api/chat - Request received");
    try {
        console.log(">>> INCOMING CHAT REQUEST <<<");
        const json = await req.json();
        const { messages } = json;
        console.log("JSON parsed, message count:", messages?.length);

        // 1. Get User Session
        let userId: string | undefined;
        try {
            console.log("Fetching session...");
            // Race session fetch against 2s timeout
            const sessionPromise = getServerSession();
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Auth timeout")), 2000));

            const session: any = await Promise.race([sessionPromise, timeoutPromise]);

            console.log("Session fetched, user:", session?.user?.id);
            userId = session?.user?.id;
        } catch (authError) {
            console.error("Session fetch failed (or timed out), proceeding as anonymous:", authError);
        }

        console.log("Fetching settings...");
        const settings = await getAISettings(); // Now resilient
        console.log("AI Settings fetched:", settings?.enabled);

        if (!settings.enabled) {
            return new Response("AI Assistant is disabled by administrator.", { status: 403 });
        }

        // 2. Select Model (Default to settings)
        const providerKey = settings.provider;
        console.log("Getting model for provider:", providerKey);
        const model = getModel(providerKey);

        // 3. Prepare Tools
        console.log("Creating tools...");
        const tools = userId ? createTools(userId) : {};
        console.log("Tools created");

        // 4. Update System Prompt with Context
        let systemPrompt = settings.systemPrompt || initialSystemPrompt;
        if (userId) {
            systemPrompt += `\n\nCurrent User ID: ${userId}. You have access to the user's data via tools. Always use tools to answer questions about payments, profile, or programmes.`;
        } else {
            systemPrompt += `\n\nThe user is NOT logged in. You cannot access personal data. Encourage them to login.`;
        }

        const temperature = parseFloat(process.env.DEEPSEEK_TEMPERATURE || "0.7");
        const maxTokens = parseInt(process.env.DEEPSEEK_MAX_TOKENS || "2000");

        console.log("Streaming response with RAG tools...", { temperature, maxTokens });

        // Logic to toggle tools based on provider
        const isDeepSeek = settings.provider === 'deepseek';
        const activeTools = isDeepSeek ? {} : (tools as any);
        const activeMaxSteps = isDeepSeek ? 1 : 5;

        console.log(`Streaming response (Provider: ${settings.provider}, Tools Enabled: ${!isDeepSeek})...`, { temperature, maxTokens });

        const result = await streamText({
            model: model,
            system: systemPrompt,
            messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
            ...(isDeepSeek ? {} : {
                tools: activeTools,
                maxSteps: activeMaxSteps,
            }),
            temperature: temperature,
            maxTokens: maxTokens,
        } as any);

        return (result as any).toDataStreamResponse();
    } catch (error) {
        console.error("Error in /api/chat:", error);
        return new Response(JSON.stringify({
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        }), { status: 500 });
    }
}
