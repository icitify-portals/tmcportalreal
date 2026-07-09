import { Suspense } from "react"
import { ClientOnly } from "@/components/shared/client-only"
import Link from "next/link"
import { db } from "@/lib/db"
import { getOrganizationTree } from "@/lib/org-helper"
import { organizations, galleries, galleryImages, fundraisingCampaigns, programmes } from "@/lib/db/schema"
import { eq, and, desc, inArray, gte, asc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Facebook, Twitter, Instagram, Linkedin, Calendar, Newspaper, ArrowRight, Heart } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

// CMS Components
import { HeroSlider } from "@/components/cms/hero-slider"
import { MissionVision } from "@/components/cms/mission-vision"
import { ExploreCommunity } from "@/components/cms/explore-community"
import { ContactLocation } from "@/components/cms/contact-location"
import { PublicNav } from "@/components/layout/public-nav"
import { NewsFeed } from "@/components/cms/news-feed"

export const dynamic = "force-dynamic"

async function NationalContent() {
  // Fetch National Org
  const nationalOrg = await db.query.organizations.findFirst({
    where: eq(organizations.level, "NATIONAL"),
  })

  // Fallback if seeded or queried but empty - though our seed script ensures this exists.
  if (!nationalOrg) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-4xl font-bold">Welcome to TMC Portal</h1>
        <p className="mt-4 text-muted-foreground">System configuration in progress (National Org not found).</p>
      </div>
    )
  }

  // Fetch hierarchical community data
  const communityData = await getOrganizationTree();

  // Fetch Galleries separately 
  const rawGalleries = await db.query.galleries.findMany({
    where: and(eq(galleries.organizationId, nationalOrg.id), eq(galleries.isActive, true)),
    limit: 1
  })

  // Fetch Latest Active Campaign
  const latestCampaign = await db.query.fundraisingCampaigns.findFirst({
    where: and(
      eq(fundraisingCampaigns.organizationId, nationalOrg.id),
      eq(fundraisingCampaigns.status, 'ACTIVE')
    ),
    orderBy: [desc(fundraisingCampaigns.createdAt)],
  })

  // Fetch Upcoming Approved Programmes
  const upcomingProgrammes = await db.select({
    id: programmes.id,
    title: programmes.title,
    venue: programmes.venue,
    startDate: programmes.startDate,
    time: programmes.time,
    format: programmes.format,
    flyerUrl: programmes.flyerUrl,
  })
  .from(programmes)
  .where(
    and(
      eq(programmes.status, "APPROVED"),
      gte(programmes.startDate, new Date())
    )
  )
  .orderBy(asc(programmes.startDate))
  .limit(4)

  // Manual fetch of images to avoid LATERAL JOIN
  const galleriesWithImages = await Promise.all(rawGalleries.map(async (gallery) => {
    const images = await db.query.galleryImages.findMany({
      where: eq(galleryImages.galleryId, gallery.id)
    });
    return { ...gallery, images };
  }));

  // Attach galleries and children to the object for component logic consistency
  const orgWithGalleries = {
    ...nationalOrg,
    galleries: galleriesWithImages,
    children: communityData.map(d => d.name) // Legacy fallback using static data
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Header */}
      <PublicNav />

      {/* Hero Section */}
      <div className="w-full bg-background mt-6 container mx-auto px-4">
        {(() => {
          let sliderImgs = nationalOrg.sliderImages;
          if (typeof sliderImgs === 'string') {
            try {
              sliderImgs = JSON.parse(sliderImgs);
            } catch (e) {
              sliderImgs = [];
            }
          }
          const images = (Array.isArray(sliderImgs) && sliderImgs.length > 0)
            ? sliderImgs
            : (nationalOrg.welcomeImageUrl ? [{ url: nationalOrg.welcomeImageUrl }] : []);

          return (
            <ClientOnly>
              <HeroSlider images={images as any[]} title={nationalOrg.name} />
            </ClientOnly>
          );
        })()}
      </div>

      {/* Scrolling Flyers Marquee */}
      {upcomingProgrammes.some(p => p.flyerUrl) && (
        <div className="w-full bg-green-50/30 py-8 border-y mt-8 relative overflow-hidden flex flex-col items-center">
          <h3 className="text-2xl font-bold tracking-tight text-green-800 dark:text-green-400 mb-6 flex items-center gap-2">
            <Calendar className="h-6 w-6" /> Featured Programmes
          </h3>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(calc(-250px * ${upcomingProgrammes.filter(p => p.flyerUrl).length} - 1.5rem * ${upcomingProgrammes.filter(p => p.flyerUrl).length})); }
            }
            .animate-scroll {
              animation: scroll 30s linear infinite;
            }
            .animate-scroll:hover {
              animation-play-state: paused;
            }
          `}} />
          <div className="w-full max-w-[100vw] overflow-hidden flex">
            {/* Double the array for infinite scroll effect if few items, or just rely on a simple scroll */}
            <div className="flex gap-6 animate-scroll w-max px-4">
              {[...upcomingProgrammes.filter(p => p.flyerUrl), ...upcomingProgrammes.filter(p => p.flyerUrl)].map((p, i) => (
                <Link key={`${p.id}-${i}`} href={`/programmes/registrations/${p.id}/register`} className="shrink-0 group relative overflow-hidden rounded-xl shadow-md border-2 border-transparent hover:border-green-500 transition-all w-[250px] aspect-[4/5] bg-white">
                  <img src={p.flyerUrl as string} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                    <p className="text-white font-bold mb-2 line-clamp-2">{p.title}</p>
                    <span className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-green-700 transition-colors">Register Now</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow container mx-auto px-4 py-12 space-y-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-16">
            {/* Welcome */}
            <section className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tight text-green-800 dark:text-green-400 border-b pb-2">Welcome Message</h2>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {nationalOrg.welcomeImageUrl && (
                  <div className="w-full md:w-1/3 shrink-0 rounded-xl overflow-hidden shadow-md border-4 border-white dark:border-gray-800 -rotate-2 hover:rotate-0 transition-transform duration-500">
                    <img src={nationalOrg.welcomeImageUrl} alt="Welcome" className="w-full h-auto object-cover" />
                  </div>
                )}
                <div className="prose prose-lg dark:prose-invert text-muted-foreground leading-relaxed">
                  <div dangerouslySetInnerHTML={{ __html: nationalOrg.welcomeMessage as string }} />
                </div>
              </div>
            </section>

            {/* Mission & Vision */}
            <MissionVision mission={nationalOrg.missionText as string} vision={nationalOrg.visionText as string} />

            {/* Recent News */}
            <section id="news" className="scroll-mt-24">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <span className="bg-green-100 dark:bg-green-900 p-2 rounded-lg text-green-700 dark:text-green-400">
                    <Newspaper className="h-6 w-6" />
                  </span>
                  Latest National Updates
                </h3>
                <Link href="#" className="hidden sm:flex items-center text-sm font-medium text-green-600 hover:text-green-700 hover:underline">
                  View All Posts <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              <ClientOnly>
                <NewsFeed organizationId={nationalOrg.id} />
              </ClientOnly>
              <div className="mt-6 sm:hidden text-center">
                <Link href="#" className="text-sm font-medium text-green-600 hover:underline">View All Posts &rarr;</Link>
              </div>
            </section>

            {/* Explore Community (Children Orgs) */}
            <Separator />
            <ClientOnly>
              <ExploreCommunity communityData={communityData} />
            </ClientOnly>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-8">

            {/* Events Card */}
            <Card>
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" /> Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {upcomingProgrammes.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="bg-muted inline-flex p-3 rounded-full mb-3">
                      <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No upcoming events scheduled at the moment.</p>
                    <Link href="/programmes">
                      <Button variant="link" className="mt-2 text-green-600">View All Programmes &rarr;</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingProgrammes.map((prog) => (
                      <Link key={prog.id} href={`/programmes`} className="block group">
                        <div className="flex gap-3 items-start p-3 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors border border-transparent hover:border-green-100">
                          <div className="shrink-0 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-400 rounded-lg w-12 h-12 flex flex-col items-center justify-center text-center">
                            <span className="text-xs font-bold leading-none">{new Date(prog.startDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                            <span className="text-lg font-bold leading-none">{new Date(prog.startDate).getDate()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-green-700 truncate">{prog.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{prog.venue}</p>
                            {prog.time && <p className="text-xs text-green-600 font-medium mt-0.5">{prog.time}</p>}
                          </div>
                          {prog.format && prog.format !== 'PHYSICAL' && (
                            <Badge variant="outline" className="shrink-0 text-[10px] border-green-200 text-green-700 ml-auto">{prog.format}</Badge>
                          )}
                        </div>
                      </Link>
                    ))}
                    <Link href="/programmes" className="block text-center">
                      <Button variant="link" size="sm" className="text-green-600 text-xs">View All Programmes &rarr;</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Donation / CTA Card */}
            {/* Donation / Campaign Card */}
            <Card className="overflow-hidden border-green-100 dark:border-green-900 shadow-md">
              <CardHeader className="bg-green-50 dark:bg-green-900/20 pb-4">
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-400">
                  <Heart className="h-5 w-5 fill-current" />
                  {latestCampaign ? "Donate to Cause" : "Support Our Cause"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {latestCampaign ? (
                  <div className="space-y-4">
                    {latestCampaign.coverImage && (
                      <div className="aspect-video w-full overflow-hidden rounded-md">
                        <img
                          src={latestCampaign.coverImage}
                          alt={latestCampaign.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold line-clamp-1" title={latestCampaign.title}>{latestCampaign.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {latestCampaign.description?.replace(/<[^>]*>?/gm, "")}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-green-600">
                          ₦{parseFloat(latestCampaign.raisedAmount || "0").toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">
                          of ₦{parseFloat(latestCampaign.targetAmount || "0").toLocaleString()}
                        </span>
                      </div>
                      <Progress
                        value={Math.min((parseFloat(latestCampaign.raisedAmount || "0") / parseFloat(latestCampaign.targetAmount || "1")) * 100, 100)}
                        className="h-2 bg-green-100"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Link href={`/${nationalOrg.code}/campaigns/${latestCampaign.slug}`} className="w-full">
                        <Button className="w-full bg-green-600 hover:bg-green-700">
                          Donate Now
                        </Button>
                      </Link>
                      <Link href={`/${nationalOrg.code}/campaigns`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full text-xs text-muted-foreground">
                          View All Campaigns
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Your contribution helps us serve the community better. Support our general cause.
                    </p>
                    <Link href={`/${nationalOrg.code}/campaigns`}>
                      <Button className="w-full">
                        Make a Donation
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact & Location Section - Moved to Bottom */}
        <section className="mt-20">
          <Separator className="mb-12" />
          <ContactLocation org={nationalOrg} />
        </section>
      </main>

      {/* Footer */}
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
              <li><Link href="/constitution" className="hover:text-white transition-colors font-semibold">TMC Constitution</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Publications</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Audio/Video</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Photo Gallery</Link></li>
            </ul>
          </div>
        </div>
        <Separator className="bg-green-900 mb-8" />
        <div className="container mx-auto px-4 text-center text-sm text-green-400/60">
          <p>&copy; <ClientOnly><span>{new Date().getFullYear()}</span></ClientOnly> The Muslim Congress (National). All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}


export default function HomePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
      <NationalContent />
    </Suspense>
  )
}
