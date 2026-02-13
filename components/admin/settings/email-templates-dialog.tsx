"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, MessageSquare, Edit } from "lucide-react"

interface EmailTemplate {
    id: string
    templateKey: string
    name: string
    subject: string
    htmlBody: string
    textBody: string | null
    variables: string[] | null
    description: string | null
}

interface EmailTemplatesDialogProps {
    children: React.ReactNode
}

export function EmailTemplatesDialog({ children }: EmailTemplatesDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [templates, setTemplates] = useState<EmailTemplate[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
    const [editMode, setEditMode] = useState(false)

    useEffect(() => {
        if (open) {
            fetchTemplates()
        }
    }, [open])

    const fetchTemplates = async () => {
        try {
            setFetching(true)
            const response = await fetch("/api/settings/email-templates")
            if (response.ok) {
                const data = await response.json()
                setTemplates(data.templates)
            }
        } catch (error) {
            toast.error("Failed to load email templates")
        } finally {
            setFetching(false)
        }
    }

    const handleEdit = (template: EmailTemplate) => {
        setSelectedTemplate(template)
        setEditMode(true)
    }

    const handleSave = async () => {
        if (!selectedTemplate) return

        try {
            setLoading(true)
            const response = await fetch(`/api/settings/email-templates/${selectedTemplate.templateKey}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject: selectedTemplate.subject,
                    htmlBody: selectedTemplate.htmlBody,
                    textBody: selectedTemplate.textBody,
                }),
            })

            if (!response.ok) throw new Error("Failed to save template")

            toast.success("Template saved successfully")
            setEditMode(false)
            setSelectedTemplate(null)
            fetchTemplates()
        } catch (error) {
            toast.error("Failed to save template")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Email Templates
                    </DialogTitle>
                    <DialogDescription>
                        Manage email templates. Use variables like {`{{name}}`}, {`{{memberId}}`}, etc.
                    </DialogDescription>
                </DialogHeader>

                {fetching ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : editMode && selectedTemplate ? (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Template</Label>
                            <Input value={selectedTemplate.name} disabled />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                value={selectedTemplate.subject}
                                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="htmlBody">HTML Body</Label>
                            <Textarea
                                id="htmlBody"
                                rows={8}
                                value={selectedTemplate.htmlBody}
                                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, htmlBody: e.target.value })}
                                className="font-mono text-sm"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="textBody">Plain Text Body (Optional)</Label>
                            <Textarea
                                id="textBody"
                                rows={4}
                                value={selectedTemplate.textBody || ""}
                                onChange={(e) => setSelectedTemplate({ ...selectedTemplate, textBody: e.target.value })}
                            />
                        </div>
                        {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                            <div className="bg-muted p-3 rounded-md">
                                <p className="text-sm font-medium mb-2">Available Variables:</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTemplate.variables.map((variable) => (
                                        <code key={variable} className="text-xs bg-background px-2 py-1 rounded">
                                            {`{{${variable}}}`}
                                        </code>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {templates.map((template) => (
                            <div key={template.id} className="flex items-center justify-between p-3 border rounded-md">
                                <div>
                                    <p className="font-medium">{template.name}</p>
                                    <p className="text-sm text-muted-foreground">{template.description}</p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => handleEdit(template)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                <DialogFooter>
                    {editMode ? (
                        <>
                            <Button variant="outline" onClick={() => { setEditMode(false); setSelectedTemplate(null); }}>
                                Back
                            </Button>
                            <Button onClick={handleSave} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Template
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Close
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
