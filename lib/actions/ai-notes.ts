"use server"

import { generateText } from "ai"
import { getModel } from "@/lib/ai/config"
import { getAISettings } from "@/lib/actions/settings"

export async function generateNoteSummary(text: string) {
    if (!text || text.length < 10) return { success: false, error: "Not enough text" }

    try {
        const settings = await getAISettings()
        if (!settings.enabled) {
            return { success: false, error: "AI Assistant is disabled by administrator" }
        }

        const model = getModel(settings.provider)

        const result = await generateText({
            model,
            system: "You are an AI meeting assistant. Distil the notes into decisions and agreed actions. Format as clean HTML with these sections in order: \"Key Decisions\" (bulleted, each decision is a short specific sentence naming what/why), \"Action Items\" (bulleted, each starts with who owns it and by when if known), \"Open Questions\" (bulleted, items raised but not resolved). Use <h4> for section headings and <ul>/<li> for items. Keep it under 400 words, specific, not vague. Do not include markdown codeblocks or 'html' tags, just the raw HTML.",
            prompt: "Summarize the following meeting notes, then extract decisions, action items, and open questions:\n\n" + text,
            temperature: 0.3,
        });

        let html = result.text.trim();
        if (html.startsWith("```html")) html = html.replace(/```html/g, "").replace(/```/g, "").trim();
        if (html.startsWith("```")) html = html.replace(/```/g, "").trim();

        return { success: true, html: "<h3>AI Summary & Action Items</h3>" + html };
    } catch(e) {
        console.error(e)
        return { success: false, error: "Failed to summarize" }
    }
}
