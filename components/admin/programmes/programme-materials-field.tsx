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
        <div className="space-y-4 border p-4 rounded-md bg-green-50/30 mt-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-black flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Programme Materials
                    </h3>
                    <p className="text-xs text-black">Add presentation slides, documents, or videos for participants.</p>
                </div>
                <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => append({ title: "", url: "", fileType: "DOCUMENT" })}
                    className="border-green-200 text-green-700 hover:bg-green-50"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Material
                </Button>
            </div>

            {fields.length > 0 && (
                <div className="space-y-4 mt-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-4 items-start p-3 border rounded-md bg-white">
                            <FormField
                                control={control}
                                name={`materials.${index}.title`}
                                render={({ field: inputField }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Day 1 Slides" {...inputField} />
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
                                        <FormLabel className="text-xs">File URL / Upload</FormLabel>
                                        <div className="flex items-center gap-2">
                                            <FormControl>
                                                <Input placeholder="URL or Upload ->" {...inputField} />
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
                <div className="text-center py-6 border-2 border-dashed border-green-100 rounded-md bg-white/50">
                    <p className="text-sm text-green-600/60">No materials added yet.</p>
                </div>
            )}
        </div>
    )
}
