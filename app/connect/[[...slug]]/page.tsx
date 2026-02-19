export const dynamic = 'force-dynamic'

import React from "react";
import { notFound } from "next/navigation";
import Link from 'next/link';
import { db } from "@/lib/db";
import { locationData } from "@/lib/location-data";
import { posts, organizations, users } from "@/lib/db/schema";
import { eq, desc, and, like, inArray } from "drizzle-orm";
import { format } from "date-fns";
import { MapPin, Phone, Mail, Globe, Calendar, Newspaper, Clock, MessageCircle, ChevronRight, ArrowRight, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PublicNav } from "@/components/layout/public-nav";

// --- Components ---

// --- Components ---

const HeroSlider = ({ images, title }: { images: any[], title: string }) => {
    // ... (unchanged)
    // If no images, show a default hero
    if (!images || images.length === 0) {
        return (
            <div className="relative h-[400px] w-full bg-gradient-to-r from-green-900 to-green-700 rounded-xl overflow-hidden shadow-xl flex items-center justify-center text-white">
                <div className="text-center space-y-4 p-6">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-md">{title}</h1>
                    <p className="text-xl md:text-2xl font-light text-green-100 max-w-2xl mx-auto">Welcome to our official portal</p>
                </div>
            </div>
        );
    }

    // Simple single image for now, can be expanded to real slider with client component
    const heroImage = images[0];
    return (
        <div className="relative h-[400px] w-full bg-black rounded-xl overflow-hidden shadow-xl group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={heroImage.url}
                alt={heroImage.title || title}
                className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-lg mb-2">{heroImage.title || title}</h1>
                {heroImage.subtitle && (
                    <p className="text-xl md:text-2xl font-light text-green-100 max-w-2xl drop-shadow-md">{heroImage.subtitle}</p>
                )}
            </div>
        </div>
    );
};

const MissionVision = ({ mission, vision }: { mission?: string, vision?: string }) => {
    if (!mission && !vision) return null;
    return (
        <div className="grid md:grid-cols-2 gap-8 my-12">
            {mission && (
                <div className="bg-green-50 dark:bg-green-900/10 p-8 rounded-2xl border border-green-100 dark:border-green-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Globe className="h-32 w-32 text-green-900" />
                    </div>
                    <h3 className="text-2xl font-bold text-green-800 dark:text-green-400 mb-4 flex items-center gap-2">
                        <span className="bg-green-600 w-1 h-8 rounded-full"></span> Our Mission
                    </h3>
                    <div className="prose prose-green dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: mission }} />
                </div>
            )}
            {vision && (
                <div className="bg-blue-50 dark:bg-blue-900/10 p-8 rounded-2xl border border-blue-100 dark:border-blue-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Clock className="h-32 w-32 text-blue-900" />
                    </div>
                    <h3 className="text-2xl font-bold text-blue-800 dark:text-blue-400 mb-4 flex items-center gap-2">
                        <span className="bg-blue-600 w-1 h-8 rounded-full"></span> Our Vision
                    </h3>
                    <div className="prose prose-blue dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: vision }} />
                </div>
            )}
        </div>
    )
}

const ExploreCommunity = ({ childrenOrgs, level, basePath }: { childrenOrgs: any[], level: string, basePath: string }) => {
    if (!childrenOrgs || childrenOrgs.length === 0) return null;

    const childLabel = level === 'National' ? 'States' : level === 'State' ? 'Local Governments' : 'Branches';

    return (
        <section className="space-y-6 py-8">
            <h3 className="text-2xl font-bold flex items-center gap-2">
                Explore Our Community
                <Badge variant="secondary" className="ml-2 text-sm font-normal">{childrenOrgs.length} {childLabel}</Badge>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {childrenOrgs.map((org) => {
                    // Ensure we don't double slash and handle spaces
                    const safeName = org.name.replace(/ /g, '%20'); // Use %20 for URL encoding safety
                    const href = `${basePath}/${safeName}`;

                    return (
                        <Link key={org.id} href={href}>
                            <Card className="hover:shadow-lg transition-all hover:border-green-500 cursor-pointer h-full group">
                                <CardHeader className="p-4">
                                    <CardTitle className="text-lg group-hover:text-green-700 flex justify-between items-center">
                                        {org.name}
                                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                                    </CardTitle>
                                    <CardDescription className="line-clamp-1">{org.address || "Serving the community"}</CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    )
                })}
            </div>
        </section>
    );
}

const ContactLocation = ({ org }: { org: any }) => (
    <Card className="h-fit">
        <CardHeader className="bg-primary/5 pb-4">
            <CardTitle>Location & Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
            {org.address && (
                <div className="flex gap-3">
                    <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className="font-semibold text-sm">Address</h4>
                        <p className="text-sm text-muted-foreground">{org.address}</p>
                        <p className="text-sm text-muted-foreground">{org.city} {org.state}</p>
                    </div>
                </div>
            )}

            {(org.phone || org.whatsapp) && (
                <div className="flex gap-3">
                    <Phone className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className="font-semibold text-sm">Phone</h4>
                        {org.phone && <p className="text-sm text-muted-foreground"><a href={`tel:${org.phone}`} className="hover:underline">{org.phone}</a></p>}
                        {org.whatsapp && (
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                <a href={`https://wa.me/${org.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" className="hover:underline text-green-600 font-medium">WhatsApp Chat</a>
                            </p>
                        )}
                    </div>
                </div>
            )}

            {org.email && (
                <div className="flex gap-3">
                    <Mail className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className="font-semibold text-sm">Email</h4>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]" title={org.email}>
                            <a href={`mailto:${org.email}`} className="hover:underline">{org.email}</a>
                        </p>
                    </div>
                </div>
            )}

            {org.officeHours && (
                <div className="flex gap-3">
                    <Clock className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className="font-semibold text-sm">Office Hours</h4>
                        <p className="text-sm text-muted-foreground">{org.officeHours}</p>
                    </div>
                </div>
            )}

            {org.googleMapUrl && (
                <div className="pt-2 rounded-md overflow-hidden border">
                    <iframe
                        src={org.googleMapUrl}
                        width="100%"
                        height="200"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                </div>
            )}
        </CardContent>
    </Card>
);

// --- NEW COMPONENT: News Feed ---
async function NewsFeed({ organizationId }: { organizationId?: string }) {
    const rawPosts = await db.query.posts.findMany({
        where: organizationId ? eq(posts.organizationId, organizationId) : undefined,
        orderBy: [desc(posts.createdAt)],
        limit: 3,
    });

    // Manually fetch authors to avoid LATERAL JOIN
    const authorIds = [...new Set(rawPosts.map(p => p.authorId))];
    const authors = authorIds.length > 0 ? await db.query.users.findMany({
        where: inArray(users.id, authorIds)
    }) : [];

    const postsData = rawPosts.map(post => ({
        ...post,
        author: authors.find(a => a.id === post.authorId)
    }));

    if (postsData.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground border rounded-lg bg-muted/30">
                <p>No recent news or updates available securely at this time.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {postsData.map((post) => (
                <Card key={post.id} className="flex flex-col h-full hover:shadow-md transition-all">
                    {post.coverImage ? (
                        <div className="h-48 w-full bg-gray-200 rounded-t-lg overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="h-48 w-full bg-primary/10 rounded-t-lg flex items-center justify-center text-primary/30">
                            <Newspaper className="h-16 w-16" />
                        </div>
                    )}
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <Badge variant={post.postType === 'NEWS' ? 'default' : 'secondary'} className="mb-2 text-xs">
                                {post.postType}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(post.createdAt || new Date()), 'MMM d, yyyy')}
                            </span>
                        </div>
                        <CardTitle className="line-clamp-2 text-lg">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <div className="text-sm text-muted-foreground line-clamp-3 prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: post.excerpt || post.content.substring(0, 150) + "..." }} />
                    </CardContent>
                    <div className="p-6 pt-0 mt-auto">
                        <Button variant="ghost" size="sm" asChild className="p-0 h-auto font-medium text-green-600 hover:text-green-700 hover:bg-transparent p-0">
                            <Link href={`#`} className="flex items-center gap-1">
                                Read full story <ArrowRight className="h-3 w-3" />
                            </Link>
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    )
}


interface PageProps {
    params: Promise<{
        slug?: string[];
    }>;
}

export default async function DynamicJurisdictionPage({ params }: PageProps) {
    const slugParams = await params;
    const slug = slugParams.slug || [];

    // Determine context based on slug
    // e.g. /connect -> National
    // /connect/Lagos -> State
    // /connect/Lagos/Ikeja -> LGA

    let orgQueryName = "The Muslim Congress"; // Default fallback (National)
    let level = "National";

    // IMPORTANT: This name matching logic assumes organization names match the URL segments.
    // In a production app, we should use a dedicated `slug` field in DB.
    // For now we try to match by name.

    if (slug.length > 0) {
        orgQueryName = decodeURIComponent(slug[slug.length - 1]);
        if (slug.length === 1) level = "State";
        if (slug.length === 2) level = "LGA";
        if (slug.length >= 3) level = "Branch";
    }

    // Try to find the organization
    // We use 'like' for loose matching or exact match if possible
    const org = await db.query.organizations.findFirst({
        where: (organizations, { or, eq, like }) => or(
            eq(organizations.name, orgQueryName),
            like(organizations.name, `%${orgQueryName}%`) // Fallback loose match
        )
    });

    // Manually fetch children to avoid LATERAL JOIN issues on certain DB versions (MariaDB < 10.5)
    let children: typeof org[] = [];
    if (org) {
        children = await db.query.organizations.findMany({
            where: eq(organizations.parentId, org.id)
        });
    }

    // Priority: Use static locationData if available (as requested by user)
    let staticChildren: any[] = [];
    try {
        if (slug.length === 0) {
            // National -> list states
            staticChildren = Object.keys(locationData).map(name => ({ id: name, name, address: null }));
        } else if (slug.length === 1) {
            // State -> list LGAs
            const stateName = decodeURIComponent(slug[0]);
            // Attempt to find exact match
            const stateData = (locationData as any)[stateName] ||
                Object.entries(locationData).find(([k]) => k.toLowerCase() === stateName.toLowerCase())?.[1];

            if (stateData && stateData.lgas) {
                staticChildren = stateData.lgas.map((lga: any) => ({ id: lga.name, name: lga.name, address: null }));
            }
        } else if (slug.length === 2) {
            // LGA -> list branches
            const stateName = decodeURIComponent(slug[0]);
            const lgaName = decodeURIComponent(slug[1]);

            const stateData = (locationData as any)[stateName] ||
                Object.entries(locationData).find(([k]) => k.toLowerCase() === stateName.toLowerCase())?.[1];

            if (stateData && stateData.lgas) {
                const lgaData = stateData.lgas.find((l: any) => l.name.toLowerCase() === lgaName.toLowerCase());
                if (lgaData && lgaData.branches) {
                    staticChildren = lgaData.branches.map((b: string) => ({ id: b, name: b, address: null }));
                }
            }
        }
    } catch (e) {
        console.error("Error parsing location data", e);
    }

    if (staticChildren.length > 0) {
        children = staticChildren as any;
    }

    // Check if the path exists in our static location data
    let staticMatch = false;
    let staticOrgName = orgQueryName;

    if (!org && slug.length > 0) {
        try {
            if (slug.length === 1) {
                // State Level
                const stateName = decodeURIComponent(slug[0]);
                const stateData = (locationData as any)[stateName] ||
                    Object.entries(locationData).find(([k]) => k.toLowerCase() === stateName.toLowerCase())?.[1];
                if (stateData) {
                    staticMatch = true;
                    staticOrgName = stateName;
                }
            } else if (slug.length === 2) {
                // LGA Level
                const stateName = decodeURIComponent(slug[0]);
                const lgaName = decodeURIComponent(slug[1]);
                const stateData = (locationData as any)[stateName] ||
                    Object.entries(locationData).find(([k]) => k.toLowerCase() === stateName.toLowerCase())?.[1];
                if (stateData && stateData.lgas) {
                    const lga = stateData.lgas.find((l: any) => l.name.toLowerCase() === lgaName.toLowerCase());
                    if (lga) {
                        staticMatch = true;
                        staticOrgName = lga.name;
                    }
                }
            } else if (slug.length >= 3) {
                // Branch Level
                const stateName = decodeURIComponent(slug[0]);
                const lgaName = decodeURIComponent(slug[1]);
                const branchName = decodeURIComponent(slug[2]);

                const stateData = (locationData as any)[stateName] ||
                    Object.entries(locationData).find(([k]) => k.toLowerCase() === stateName.toLowerCase())?.[1];
                if (stateData && stateData.lgas) {
                    const lga = stateData.lgas.find((l: any) => l.name.toLowerCase() === lgaName.toLowerCase());
                    if (lga && lga.branches) {
                        const branch = lga.branches.find((b: string) =>
                            b.toLowerCase().trim() === branchName.toLowerCase().trim() ||
                            b.toLowerCase().replace(/ /g, '-') === branchName.toLowerCase()
                        );
                        if (branch) {
                            staticMatch = true;
                            staticOrgName = branch;
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Static location check failed", e);
        }

        if (!staticMatch) {
            // Only 404 if truly not found in DB AND not found in static location data
            notFound();
        }
    }

    // Use default National data if not found logic didn't trigger
    const safeOrg = org ? { ...org, children } : {
        id: slug.join("-") || "national", // Generate specific ID for static pages
        name: staticMatch ? staticOrgName : "The Muslim Congress (National)",
        welcomeMessage: `<p>Welcome to The Muslim Congress <strong>${staticMatch ? staticOrgName : "(National)"}</strong>. We are a community dedicated to faith, unity, and progress.</p>`,
        welcomeImageUrl: "",
        missionText: "<p>To be a leading Islamic organization...</p>",
        visionText: "<p>A society where Islamic values prevail...</p>",
        sliderImages: [] as any[],
        children: staticChildren, // Use the static children we found earlier
        address: staticMatch ? `${staticOrgName}, Nigeria` : "Headquarters, Nigeria",
        city: slug.length > 0 ? decodeURIComponent(slug[slug.length - 1]) : "Abuja",
        state: slug.length > 0 ? decodeURIComponent(slug[0]) : "FCT",
        email: "info@tmcng.net",
        phone: "+234 800 000 0000",
        whatsapp: "",
        officeHours: "Mon-Fri, 9am - 5pm",
        googleMapUrl: "",
        socialLinks: {},
    };

    return (
        <div className="min-h-screen flex flex-col bg-background font-sans">
            {/* Header */}
            <PublicNav />

            {/* Hero Section */}
            <div className="w-full bg-background mt-6 container mx-auto px-4">
                <HeroSlider images={safeOrg.sliderImages as any[]} title={safeOrg.name} />
            </div>

            <main className="flex-grow container mx-auto px-4 py-12 space-y-20">
                {/* Breadcrumbs for easier navigation */}
                <div className="flex items-center text-sm text-muted-foreground -mt-8 mb-4 overflow-x-auto whitespace-nowrap">
                    <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <Link href="/connect" className={`hover:text-primary transition-colors ${slug.length === 0 ? 'font-bold text-green-700' : ''}`}>National</Link>
                    {slug.map((s, i) => (
                        <div key={i} className="flex items-center">
                            <ChevronRight className="h-4 w-4 mx-1" />
                            <Link href={`/connect/${slug.slice(0, i + 1).join('/')}`} className={`hover:text-primary transition-colors ${i === slug.length - 1 ? 'font-bold text-green-700' : ''}`}>
                                {decodeURIComponent(s)}
                            </Link>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Content Column */}
                    <div className="lg:col-span-8 space-y-16">
                        {/* Welcome */}
                        <section className="space-y-6">
                            <h2 className="text-3xl font-bold tracking-tight text-green-800 dark:text-green-400 border-b pb-2">Welcome Message</h2>
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                {safeOrg.welcomeImageUrl && (
                                    <div className="w-full md:w-1/3 shrink-0 rounded-xl overflow-hidden shadow-md border-4 border-white dark:border-gray-800 -rotate-2 hover:rotate-0 transition-transform duration-500">
                                        <img src={safeOrg.welcomeImageUrl} alt="Welcome" className="w-full h-auto object-cover" />
                                    </div>
                                )}
                                <div className="prose prose-lg dark:prose-invert text-muted-foreground leading-relaxed">
                                    <div dangerouslySetInnerHTML={{ __html: safeOrg.welcomeMessage as string }} />
                                </div>
                            </div>
                        </section>

                        {/* Mission & Vision */}
                        <MissionVision mission={safeOrg.missionText as string} vision={safeOrg.visionText as string} />

                        {/* Recent News */}
                        <section id="news" className="scroll-mt-24">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-bold flex items-center gap-2">
                                    <span className="bg-green-100 dark:bg-green-900 p-2 rounded-lg text-green-700 dark:text-green-400">
                                        <Newspaper className="h-6 w-6" />
                                    </span>
                                    Latest Updates from {safeOrg.name}
                                </h3>
                                <Link href="#" className="hidden sm:flex items-center text-sm font-medium text-green-600 hover:text-green-700 hover:underline">
                                    View All Posts <ArrowRight className="h-4 w-4 ml-1" />
                                </Link>
                            </div>
                            <NewsFeed organizationId={org?.id} />
                            <div className="mt-6 sm:hidden text-center">
                                <Link href="#" className="text-sm font-medium text-green-600 hover:underline">View All Posts &rarr;</Link>
                            </div>
                        </section>

                        {/* Explore Community (Children Orgs) */}
                        <Separator />
                        <ExploreCommunity
                            childrenOrgs={safeOrg.children as any[]}
                            level={level}
                            basePath={`/connect${slug.length > 0 ? '/' + slug.map(s => encodeURIComponent(decodeURIComponent(s))).join('/') : ''}`}
                        />
                    </div>

                    {/* Sidebar Column */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Contact Card */}
                        <ContactLocation org={safeOrg} />

                        {/* Events Card */}
                        <Card>
                            <CardHeader className="bg-primary/5 pb-4">
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-green-600" /> Upcoming Events
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="text-center py-8">
                                    <div className="bg-muted inline-flex p-3 rounded-full mb-3">
                                        <Calendar className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">No upcoming events scheduled at the moment.</p>
                                    <Button variant="link" className="mt-2 text-green-600">Check Calendar &rarr;</Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Donation / CTA Card */}
                        <Card className="bg-green-800 text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-green-600 rounded-full opacity-50 blur-2xl"></div>
                            <CardHeader>
                                <CardTitle>Support Our Cause</CardTitle>
                                <CardDescription className="text-green-100">Your contribution helps us serve the community better.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full bg-white text-green-800 hover:bg-green-50 font-bold shadow-lg border-0">
                                    Donate Now
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            <footer className="bg-green-950 text-green-100 py-12 border-t border-green-900 mt-auto">
                <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2 space-y-4">
                        <h3 className="text-2xl font-bold text-white">The Muslim Congress</h3>
                        <p className="text-sm text-green-200/80 max-w-sm leading-relaxed">
                            Dedicated to fostering unity, understanding, and development within the Muslim community and society at large.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <Link href="#" className="hover:text-white transition-colors"><Facebook className="h-5 w-5" /></Link>
                            <Link href="#" className="hover:text-white transition-colors"><Twitter className="h-5 w-5" /></Link>
                            <Link href="#" className="hover:text-white transition-colors"><Instagram className="h-5 w-5" /></Link>
                            <Link href="#" className="hover:text-white transition-colors"><Linkedin className="h-5 w-5" /></Link>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                            <li><Link href="/connect" className="hover:text-white transition-colors">Connect</Link></li>
                            <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="#" className="hover:text-white transition-colors">Publications</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Audio/Video</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Photo Gallery</Link></li>
                        </ul>
                    </div>
                </div>
                <Separator className="bg-green-900 mb-8" />
                <div className="container mx-auto px-4 text-center text-sm text-green-400/60">
                    <p>&copy; <span suppressHydrationWarning>{new Date().getFullYear()}</span> The Muslim Congress - {safeOrg.name}. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
