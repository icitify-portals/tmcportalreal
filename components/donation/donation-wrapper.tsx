"use client"

import dynamic from 'next/dynamic'

const DonationForm = dynamic(() => import('./donation-form'), {
    ssr: false,
    loading: () => <div className="h-96 w-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div></div>
})

export default function DonationWrapper() {
    return <DonationForm />
}
