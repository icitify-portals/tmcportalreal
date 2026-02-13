import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { organizations, galleries, galleryImages } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Mail, ArrowLeft } from "lucide-react"
import { HeroSlider } from "@/components/cms/hero-slider"
import { ExploreCommunity } from "@/components/cms/explore-community"
import { getOrganizationTree } from "@/lib/org-helper"

// Force dynamic rendering as content changes frequently
export const dynamic = "force-dynamic"

interface PageProps {
    params: Promise<{ jurisdiction: string }>
}

async function JurisdictionContent({ slug }: { slug: string }) {
    // Try to match slug to organization 'code' or maybe we strictly use 'code' in URL like 'LAGOS_STATE'
    // Or better, let's assume we use the 'code' for now as it is unique.
    // Ideally we would have a 'slug' field, but 'code' works if clean.

    // Clean slug to match code format slightly? 
    // Let's assume URL is exactly the code for now or use `ilike` if needed (but drizzle mysql ilike might vary).
    // Let's stick to exact code match for simplicity first.

    const orgCode = slug.toUpperCase()

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.code, orgCode),
    })

    if (!org) {
        // Fallback: Check if it's a "state" or "lg" route helper page?
        // For now, 404
        return notFound()
    }

    // Fetch Galleries and Children separately to avoid MariaDB 10.4 incompatibility with LATERAL JOIN
    const orgGalleries = await db.query.galleries.findMany({
        where: and(eq(galleries.organizationId, org.id), eq(galleries.isActive, true)),
        limit: 1
    })

    // Manual fetch of images to avoid LATERAL JOIN
    const galleriesWithImages = await Promise.all(orgGalleries.map(async (gallery) => {
        const images = await db.query.galleryImages.findMany({
            where: eq(galleryImages.galleryId, gallery.id)
        });
        return { ...gallery, images };
    }));

    const orgChildren = await db.query.organizations.findMany({
        where: and(eq(organizations.parentId, org.id), eq(organizations.isActive, true)),
        limit: 10
    })

    const orgWithRelations = {
        ...org,
        galleries: galleriesWithImages,
        children: orgChildren
    }

    const communityData = await getOrganizationTree()

    return (
        <div className="space-y-16 pb-20">
            {/* Header / Nav Back */}
            <div className="bg-muted py-4">
                <div className="container px-4 md:px-6">
                    <Link href="/" className="flex items-center text-sm text-muted-foreground hover:text-primary">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to National
                    </Link>
                </div>
            </div>

            {/* Hero Section */}
            <div className="container px-4 md:px-6 py-8">
                <HeroSlider
                    images={
                        (org.sliderImages as any[])?.length > 0
                            ? (org.sliderImages as any[])
                            : org.welcomeImageUrl
                                ? [{ url: org.welcomeImageUrl }]
                                : []
                    }
                    title={org.name}
                    description={org.description || undefined}
                />
            </div>

            {/* Welcome Message */}
            {orgWithRelations.welcomeMessage && (
                <section className="container px-4 md:px-6 pb-12">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                                {orgWithRelations.level.replace("_", " ")}
                            </div>
                            <div className="max-w-[800px] text-muted-foreground md:text-xl">
                                <div dangerouslySetInnerHTML={{ __html: orgWithRelations.welcomeMessage }} />
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Gallery Section */}
            {orgWithRelations.galleries.length > 0 && orgWithRelations.galleries[0].images.length > 0 && (
                <section className="container px-4 md:px-6">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Gallery</h2>
                            <p className="max-w-[900px] text-muted-foreground">
                                Recent events at {orgWithRelations.name}.
                            </p>
                        </div>
                    </div>
                    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
                        {orgWithRelations.galleries[0].images.map((img) => (
                            <Card key={img.id} className="overflow-hidden">
                                <div className="aspect-video w-full overflow-hidden">
                                    <img
                                        src={img.imageUrl}
                                        alt={img.caption || "Gallery Image"}
                                        className="h-full w-full object-cover transition-all hover:scale-105"
                                    />
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* Sub-Jurisdictions (e.g. LGs under a State) */}
            {orgWithRelations.children.length > 0 && (
                <section className="bg-muted/30 py-16">
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                                {orgWithRelations.level === "STATE" ? "Local Governments" : "Branches"}
                            </h2>
                            <p className="max-w-[700px] text-muted-foreground">
                                Find a chapter near you in {orgWithRelations.name}.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
                            {orgWithRelations.children.map((child) => (
                                <Link key={child.id} href={`/${child.code}`}>
                                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <MapPin className="h-5 w-5" /> {child.name}
                                            </CardTitle>
                                        </CardHeader>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Explore Community Section (Global Navigation) */}
            <section className="container px-4 md:px-6">
                <ExploreCommunity communityData={communityData} />
            </section>

            {/* Contact & Info */}
            <section className="container px-4 md:px-6">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold">Contact Details</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            {org.address && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{org.address}, {org.city}, {org.state}</span>
                                </div>
                            )}
                            {org.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>{org.phone}</span>
                                </div>
                            )}
                            {org.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    <span>{org.email}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        {org.googleMapUrl && (
                            <iframe
                                src={org.googleMapUrl}
                                width="100%"
                                height="300"
                                style={{ border: 0, borderRadius: '0.5rem' }}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}

export default async function JurisdictionPage(props: PageProps) {
    const params = await props.params;
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
            <JurisdictionContent slug={params.jurisdiction} />
        </Suspense>
    )
}
