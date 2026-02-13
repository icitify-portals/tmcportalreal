"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Crop, Check, X, RotateCw } from "lucide-react"

interface ImageEditorProps {
    file: File
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (editedFile: File) => void
    maxDimensions?: { width: number, height: number }
}

export function ImageEditor({ file, open, onOpenChange, onSave, maxDimensions = { width: 1920, height: 1080 } }: ImageEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [image, setImage] = useState<HTMLImageElement | null>(null)
    const [scale, setScale] = useState(1)
    const [rotation, setRotation] = useState(0)

    // Load image
    useEffect(() => {
        if (!file || !open) return

        const img = new Image()
        img.src = URL.createObjectURL(file)
        img.onload = () => {
            // Initial fit
            setImage(img)
            setScale(1)
            setRotation(0)
        }
        return () => {
            URL.revokeObjectURL(img.src)
        }
    }, [file, open])

    // Draw to canvas
    useEffect(() => {
        if (!image || !canvasRef.current) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Display dimensions (preview) - say 400x300 fixed box? Or dynamic.
        // Let's make canvas match image aspect ratio but fitted to container
        const maxWidth = 500
        const maxHeight = 400

        // Calculate fit logic manually or just draw full size then scale via CSS?
        // Better to draw at actual resolution for editing quality, display scaled

        canvas.width = image.width
        canvas.height = image.height

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        ctx.save()
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((rotation * Math.PI) / 180)
        ctx.scale(scale, scale)
        ctx.translate(-image.width / 2, -image.height / 2)
        ctx.drawImage(image, 0, 0)
        ctx.restore()

    }, [image, scale, rotation])

    const handleSave = () => {
        if (!canvasRef.current || !image) return

        const canvas = canvasRef.current

        // Dimensions check logic
        let outputWidth = canvas.width
        let outputHeight = canvas.height

        if (outputWidth > maxDimensions.width || outputHeight > maxDimensions.height) {
            // Auto resize down if needed? User asked to "manage... max dimensions"
            // Let's warn or strict crop? User typically wants auto-resize to fit.
            const ratio = Math.min(maxDimensions.width / outputWidth, maxDimensions.height / outputHeight)
            if (ratio < 1) {
                // Create temp canvas to resize
                const tempCanvas = document.createElement('canvas')
                tempCanvas.width = outputWidth * ratio
                tempCanvas.height = outputHeight * ratio
                const tCtx = tempCanvas.getContext('2d')
                tCtx?.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height)

                tempCanvas.toBlob((blob) => {
                    if (blob) {
                        const newFile = new File([blob], file.name, { type: file.type })
                        onSave(newFile)
                        onOpenChange(false)
                    }
                }, file.type)
                return
            }
        }

        canvas.toBlob((blob) => {
            if (blob) {
                const newFile = new File([blob], file.name, { type: file.type })
                onSave(newFile)
                onOpenChange(false)
            }
        }, file.type)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Edit Image</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="border rounded-lg overflow-hidden bg-muted/50 p-4 max-h-[500px] w-full flex items-center justify-center">
                        <canvas
                            ref={canvasRef}
                            className="max-w-full max-h-[400px] object-contain shadow-sm"
                        />
                    </div>

                    <div className="w-full space-y-4 px-4">
                        <div className="flex items-center gap-4">
                            <Label className="w-20">Zoom</Label>
                            <Slider
                                value={[scale]}
                                min={0.5}
                                max={3}
                                step={0.1}
                                onValueChange={(v) => setScale(v[0])}
                            />
                            <span className="text-sm font-mono w-12">{Math.round(scale * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Label className="w-20">Rotate</Label>
                            <Slider
                                value={[rotation]}
                                min={0}
                                max={360}
                                step={90}
                                onValueChange={(v) => setRotation(v[0])}
                            />
                            <Button variant="outline" size="icon" onClick={() => setRotation((r) => (r + 90) % 360)}>
                                <RotateCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex justify-between sm:justify-between w-full">
                    <div className="text-xs text-muted-foreground self-center">
                        Max Dimensions: {maxDimensions.width}x{maxDimensions.height}px
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave}>
                            <Check className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
