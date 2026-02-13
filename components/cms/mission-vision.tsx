
import React from "react";
import { Globe, Clock } from "lucide-react";

interface MissionVisionProps {
    mission?: string;
    vision?: string;
}

export const MissionVision = ({ mission, vision }: MissionVisionProps) => {
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
