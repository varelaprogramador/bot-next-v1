"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

interface PreloaderProps {
    isVisible: boolean;
    onComplete?: () => void;
}

export const Preloader = ({ isVisible, onComplete }: PreloaderProps) => {
    const [progress, setProgress] = useState(0);
    const { theme } = useTheme();

    useEffect(() => {
        if (!isVisible) {
            setProgress(0);
            return;
        }

        const duration = 3000; // 3 segundos
        const interval = 30; // atualiza a cada 30ms
        const steps = duration / interval;
        const increment = 100 / steps;

        let currentProgress = 0;
        const timer = setInterval(() => {
            currentProgress += increment;
            setProgress(Math.min(currentProgress, 100));

            if (currentProgress >= 100) {
                clearInterval(timer);
                if (onComplete) {
                    onComplete();
                }
            }
        }, interval);

        return () => clearInterval(timer);
    }, [isVisible, onComplete]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background bg-opacity-95 backdrop-blur-sm transition-all duration-500">
            <div className="mb-6 flex items-center justify-center">
                <div className="relative">
                    <Sun
                        className={cn(
                            "absolute h-10 w-10 text-yellow-500 transition-all duration-1000",
                            theme === "dark" ? "opacity-0 rotate-0" : "opacity-100 rotate-90"
                        )}
                    />
                    <Moon
                        className={cn(
                            "h-10 w-10 text-blue-500 transition-all duration-1000",
                            theme === "dark" ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
                        )}
                    />
                </div>
            </div>

            <div className="relative h-2 w-64 overflow-hidden rounded-full bg-muted">
                <div
                    className="absolute left-0 top-0 h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <p className="mt-4 text-sm font-medium text-foreground">
                {theme === "dark" ? "Mudando para tema claro..." : "Mudando para tema escuro..."}
            </p>

            <div className="mt-8 flex justify-center space-x-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary" style={{ animationDelay: "600ms" }} />
            </div>
        </div>
    );
}; 