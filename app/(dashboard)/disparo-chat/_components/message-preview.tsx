"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface MessagePreviewProps {
    content: string;
    image?: string;
}

const MessagePreview = ({ content, image }: MessagePreviewProps) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <div className="p-3 rounded-lg border mt-2 bg-muted/20 max-h-48 overflow-auto">
            {content ? (
                <p className="text-sm whitespace-pre-wrap">{content}</p>
            ) : (
                <p className="text-sm text-muted-foreground italic">Sem conteúdo de texto</p>
            )}

            {image && (
                <div className="mt-3">
                    <img
                        src={image}
                        alt="Prévia da imagem"
                        className={cn(
                            "rounded-md max-h-36 object-contain transition-opacity duration-200",
                            imageLoaded ? "opacity-100" : "opacity-0"
                        )}
                        onLoad={() => setImageLoaded(true)}
                    />
                    {!imageLoaded && (
                        <div className="h-24 bg-muted-foreground/20 animate-pulse rounded-md"></div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MessagePreview; 