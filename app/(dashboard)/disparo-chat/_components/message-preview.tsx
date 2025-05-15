"use client";

import React from 'react';
import { Card, CardContent } from "@/app/components/ui/card";
import Image from 'next/image';

interface MessagePreviewProps {
    content: string;
    image?: string;
}

const MessagePreview = React.memo(({ content, image }: MessagePreviewProps) => {
    return (
        <Card className="mt-2 overflow-hidden">
            <CardContent className="p-4 max-h-36 overflow-auto">
                {image && (
                    <div className="mb-2 relative h-24 w-full rounded-md overflow-hidden">
                        <Image
                            src={image}
                            alt="Preview da imagem"
                            width={100}
                            height={100}
                            className="object-cover h-full w-auto mx-auto"
                            priority={true}
                        />
                    </div>
                )}
                <div className="text-sm whitespace-pre-wrap">
                    {content || <span className="text-muted-foreground italic">Nenhum conteúdo ainda...</span>}
                </div>
            </CardContent>
        </Card>
    );
});

MessagePreview.displayName = 'MessagePreview';

export default MessagePreview; 