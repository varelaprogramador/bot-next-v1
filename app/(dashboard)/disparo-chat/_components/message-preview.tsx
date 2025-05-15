"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface MessagePreviewProps {
    content: string;
    image?: string;
}

const MessagePreview = ({ content, image }: MessagePreviewProps) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    return (
        <div className="p-3 rounded-lg border mt-2 bg-muted/20 overflow-hidden flex flex-col">
            <div className="mb-3">
                {content ? (
                    <p className="text-sm whitespace-pre-wrap">{content}</p>
                ) : (
                    <p className="text-sm text-muted-foreground italic">Sem conteúdo de texto</p>
                )}
            </div>

            {image && !imageError && (
                <div className="mt-1 border-t pt-3">
                    {!imageLoaded && (
                        <div className="h-24 w-full bg-muted-foreground/20 animate-pulse rounded-md"></div>
                    )}
                    <img
                        src={image}
                        alt="Prévia da imagem"
                        className={cn(
                            "rounded-md max-h-32 object-contain transition-opacity duration-200",
                            imageLoaded ? "opacity-100" : "opacity-0"
                        )}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => {
                            setImageError(true);
                            console.error("Erro ao carregar imagem:", image);
                        }}
                    />
                </div>
            )}
            {image && imageError && (
                <div className="mt-1 border-t pt-3 text-center">
                    <p className="text-sm text-red-500">Erro ao carregar a imagem</p>
                    <p className="text-xs text-muted-foreground truncate">{image}</p>
                </div>
            )}
        </div>
    );
};

export default MessagePreview; 