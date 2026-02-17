import { Suspense } from "react"
import Link from "next/link"
import { db } from "@/lib/db"
import { getOrganizationTree } from "@/lib/org-helper"
import { organizations, galleries, galleryImages, fundraisingCampaigns } from "@/lib/db/schema"
import { eq, and, desc, inArray } from "drizzle-orm"
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
import { Navbar } from "@/components/layout/navbar"
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
      <header className="sticky top-0 z-50 w-full border-b bg-green-700/95 backdrop-blur supports-[backdrop-filter]:bg-green-700/60 text-white shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo.png" alt="TMC Logo" className="h-10 w-10 object-contain" />
            </Link>
            <span>TMC Portal</span>
            <span className="hidden md:inline font-light opacity-80 mx-2">|</span>
            <span className="hidden md:inline text-sm font-medium bg-green-800/50 px-3 py-1 rounded-full border border-green-600/50">National Headquarters</span>
          </div>
          <Navbar />
        </div>
      </header>

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

          return <HeroSlider images={images as any[]} title={nationalOrg.name} />;
        })()}
      </div>

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
              <NewsFeed organizationId={nationalOrg.id} />
              <div className="mt-6 sm:hidden text-center">
                <Link href="#" className="text-sm font-medium text-green-600 hover:underline">View All Posts &rarr;</Link>
              </div>
            </section>

            {/* Explore Community (Children Orgs) */}
            <Separator />
            <ExploreCommunity communityData={communityData} />
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
          <p>&copy; <span suppressHydrationWarning>{new Date().getFullYear()}</span> The Muslim Congress (National). All rights reserved.</p>
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
