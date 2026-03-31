import { cn } from "@/lib/utils"

interface OfficialCardProps {
    name: string
    position: string
    image: string | null
    bio?: string | null
    className?: string
}

function getInitials(name: string) {
    if (!name) return "TM"
    return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
}

export function OfficialCard({ name, position, image, bio, className }: OfficialCardProps) {
    return (
        <div className={cn(
            "group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300",
            className
        )}>
            {/* Top accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-green-600 to-teal-500" />
            
            <div className="p-6 flex flex-col items-center text-center flex-grow">
                {/* Photo */}
                <div className="h-28 w-28 rounded-2xl overflow-hidden mb-5 border-4 border-gray-50 shadow-sm shrink-0">
                    {image ? (
                        <img 
                            src={image} 
                            alt={name} 
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-green-600 to-teal-500 text-white font-bold text-3xl">
                            {getInitials(name)}
                        </div>
                    )}
                </div>

                {/* Name & Position */}
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors uppercase tracking-tight">
                    {name}
                </h3>
                <p className="text-sm font-semibold text-green-600 mt-1 uppercase tracking-wider">
                    {position}
                </p>

                {bio && (
                    <p className="mt-4 text-sm text-gray-500 leading-relaxed line-clamp-3 italic">
                        "{bio}"
                    </p>
                )}
            </div>
        </div>
    )
}
