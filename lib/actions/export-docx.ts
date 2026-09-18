"use server"

import HTMLtoDOCX from "html-to-docx"

export async function exportDocxAction(html: string) {
    try {
        const buffer = await HTMLtoDOCX(html, null, {
            table: { row: { cantSplit: true } },
            footer: true,
            pageNumber: true,
        });
        const base64 = buffer.toString('base64');
        return { success: true, base64 };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Failed to generate DOCX" };
    }
}

