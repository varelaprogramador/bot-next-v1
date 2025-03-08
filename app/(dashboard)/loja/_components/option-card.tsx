import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ShoppingBasket, Image, Layers } from 'lucide-react';
import Link from 'next/link';

interface OptionCardProps {
    title: string;
    icon: 'produtos' | 'banner' | 'carousel';
    className?: string;
    delay?: number;

    link: string
}

const OptionCard: React.FC<OptionCardProps> = ({
    title,
    icon,
    className,
    delay = 0,
    link
}) => {
    const [isHovered, setIsHovered] = useState(false);

    const getIcon = () => {
        switch (icon) {
            case 'produtos':
                return <ShoppingBasket size={36} />;
            case 'banner':
                return <Image size={36} />;
            case 'carousel':
                return <Layers size={36} />;
            default:
                return null;
        }
    };

    return (
        <Link href={"/loja" + link}>
            <div
                className={cn(
                    "relative bg-white border rounded-2xl neo-morphism p-8 flex flex-col items-center justify-center cursor-pointer card-hover h-64 opacity-0 animate-fade-in",
                    isHovered && "ring-2 ring-gray-100",
                    className
                )}
                style={{
                    animationDelay: `${0.3 + delay * 0.1}s`,
                    animationFillMode: 'forwards'
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div
                    className={cn(
                        "text-gray-800 mb-6 transition-all duration-500 ease-in-out",
                        isHovered ? "scale-110" : "animate-float"
                    )}
                >
                    {getIcon()}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 transition-all duration-300">{title}</h3>

                <div
                    className={cn(
                        "absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-gray-100 via-gray-300 to-gray-100 transform scale-x-0 transition-transform duration-300 rounded-b-2xl",
                        isHovered && "scale-x-100"
                    )}
                />
            </div>
        </Link>
    );
};

export default OptionCard;
