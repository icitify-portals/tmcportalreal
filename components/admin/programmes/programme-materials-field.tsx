"use client"

import { useFieldArray, Control } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Plus, Trash2, FileText, Link as LinkIcon } from "lucide-react"
import { FileUpload } from "@/components/ui/file-upload"

export function ProgrammeMaterialsField({ control }: { control: Control<any> }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: "materials"
    })

    return (
        <div className="space-y-4 border border-emerald-800/40 p-4 rounded-md bg-emerald-950/20 mt-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-emerald-100 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Programme Materials
                    </h3>
                    <p className="text-xs text-emerald-200/80">Add presentation slides, documents, or videos for participants.</p>
                </div>
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => append({ title: "", url: "", fileType: "DOCUMENT" })}
                    className="border-emerald-700/40 bg-emerald-950/20 text-emerald-100 hover:bg-emerald-950/40 hover:text-emerald-50"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Material
                </Button>
            </div>

            {fields.length > 0 && (
                <div className="space-y-4 mt-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-4 items-start p-3 border border-emerald-800/40 rounded-md bg-emerald-950/30">
                            <FormField
                                control={control}
                                name={`materials.${index}.title`}
                                render={({ field: inputField }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-emerald-100">Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Day 1 Slides" {...inputField} className="border-emerald-800/40 bg-emerald-950/20 text-emerald-100" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormField
                                control={control}
                                name={`materials.${index}.url`}
                                render={({ field: inputField }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-emerald-100">File URL / Upload</FormLabel>
                                        <div className="flex items-center gap-2">
                                            <FormControl>
                                                <Input placeholder="URL or Upload ->" {...inputField} className="border-emerald-800/40 bg-emerald-950/20 text-emerald-100" />
                                            </FormControl>
                                            <FileUpload 
                                                onUploadComplete={(url) => inputField.onChange(url)} 
                                                label="Upload"
                                            />
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="pt-6">
                                <Button 
                                    type="button" 
                                    variant="destructive" 
                                    size="icon"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {fields.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-emerald-800/40 rounded-md bg-emerald-950/10">
                    <p className="text-sm text-emerald-200/60">No materials added yet.</p>
                </div>
            )}
        </div>
    )
}
