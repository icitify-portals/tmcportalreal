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
            system: "You are an AI meeting assistant. Extract the key action items and decisions from the notes. Format the output as clean HTML (using <ul>, <li>, <strong>). Do not include markdown codeblocks or 'html' tags, just the raw HTML.",
            prompt: "Summarize the following meeting notes and extract action items:\n\n" + text,
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
