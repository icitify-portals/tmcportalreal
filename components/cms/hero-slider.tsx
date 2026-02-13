
"use client"

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSliderProps {
    images: { url: string; caption?: string }[];
    title: string;
    description?: string; // Fallback description if no image caption
}

export const HeroSlider = ({ images, title, description }: HeroSliderProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Filter out invalid images
    const validImages = (images || []).filter(img => img.url);

    useEffect(() => {
        if (validImages.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % validImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [validImages.length]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % validImages.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
    };

    // Fallback if no images
    if (!validImages || validImages.length === 0) {
        return (
            <div className="relative h-[400px] w-full bg-gradient-to-r from-green-900 to-green-700 rounded-xl overflow-hidden shadow-xl flex items-center justify-center text-white">
                <div className="text-center space-y-4 p-6">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-md">{title}</h1>
                    {description && <p className="text-xl md:text-2xl font-light text-green-100 max-w-2xl mx-auto">{description}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-[400px] md:h-[500px] w-full bg-black rounded-xl overflow-hidden shadow-xl group">
            {validImages.map((img, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? "opacity-100" : "opacity-0"
                        }`}
                >
                    <img
                        src={img.url}
                        alt={img.caption || title}
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center bg-black/20">
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-lg mb-2 transform transition-all duration-700 translate-y-0">
                            {title}
                        </h1>
                        {(img.caption || description) && (
                            <p className="text-xl md:text-2xl font-light text-green-100 max-w-2xl drop-shadow-md mt-4">
                                {img.caption || description}
                            </p>
                        )}
                    </div>
                </div>
            ))}

            {/* Controls */}
            {validImages.length > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-black/20 hover:text-white hidden group-hover:flex"
                        onClick={prevSlide}
                    >
                        <ChevronLeft className="h-8 w-8" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-black/20 hover:text-white hidden group-hover:flex"
                        onClick={nextSlide}
                    >
                        <ChevronRight className="h-8 w-8" />
                    </Button>

                    {/* Indicators */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
                        {validImages.map((_, index) => (
                            <button
                                key={index}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? "bg-white w-6" : "bg-white/50"
                                    }`}
                                onClick={() => setCurrentIndex(index)}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
