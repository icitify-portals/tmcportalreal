export const dynamic = 'force-dynamic'

import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getGallery } from "@/lib/actions/galleries"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AddImageDialog } from "@/components/admin/galleries/add-image-dialog"
import { DeleteImageButton } from "@/components/admin/galleries/delete-image-button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"


interface PageProps {
    params: Promise<{ id: string }>
}

export default async function GalleryManagePage({ params }: PageProps) {
    const { id } = await params
    const gallery = await getGallery(id)

    if (!gallery) {
        return notFound()
    }

    return (
        <DashboardLayout>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin/galleries">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold tracking-tight">{gallery.title}</h2>
                        <p className="text-muted-foreground">{gallery.description}</p>
                    </div>
                    <AddImageDialog galleryId={gallery.id} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {gallery.images.map((img) => (
                        <div key={img.id} className="group relative aspect-square border rounded-md overflow-hidden bg-muted">
                            <img
                                src={img.imageUrl}
                                alt={img.caption || "Gallery Image"}
                                className="object-cover w-full h-full"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <DeleteImageButton imageId={img.id} galleryId={gallery.id} />
                            </div>
                            {img.caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                                    {img.caption}
                                </div>
                            )}
                        </div>
                    ))}
                    {gallery.images.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                            No photos added yet.
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
