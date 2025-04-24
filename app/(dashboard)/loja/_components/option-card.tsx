"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { ShoppingBasket, ImageIcon, Layers, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"

interface OptionCardProps {
    title: string
    icon: "produtos" | "banner" | "carousel"
    className?: string
    delay?: number
    link: string
}

const OptionCard: React.FC<OptionCardProps> = ({ title, icon, className, delay = 0, link }) => {
    const [isHovered, setIsHovered] = useState(false)

    const getIcon = () => {
        switch (icon) {
            case "produtos":
                return <ShoppingBasket size={36} />
            case "banner":
                return <ImageIcon size={36} />
            case "carousel":
                return <Layers size={36} />
            default:
                return null
        }
    }

    const getDescription = () => {
        switch (icon) {
            case "produtos":
                return "Organize e gerencie os produtos exibidos na sua loja"
            case "banner":
                return "Configure banners promocionais para sua página inicial"
            case "carousel":
                return "Personalize carrosséis de produtos e categorias"
            default:
                return ""
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
    }

    return (
        <motion.div variants={item} whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
            <Link href={"/loja" + link} className="block h-full">
                <Card
                    className={cn(
                        "h-full overflow-hidden transition-all border",
                        "hover:border-primary/50 hover:shadow-md",
                        "dark:bg-card/80 dark:hover:bg-card/95",
                        isHovered && "ring-1 ring-primary/20",
                        className,
                    )}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <div
                            className={cn(
                                "mb-4 p-3 rounded-full bg-primary/10 text-primary",
                                "transition-all duration-300 ease-in-out",
                                isHovered ? "scale-110" : "animate-pulse",
                            )}
                        >
                            {getIcon()}
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{title}</h3>
                        <p className="text-sm text-muted-foreground">{getDescription()}</p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-center">
                        <Button
                            variant={isHovered ? "default" : "secondary"}
                            size="sm"
                            className="w-full transition-all duration-300"
                        >
                            Configurar
                            <ArrowRight size={16} className="ml-2" />
                        </Button>
                    </CardFooter>
                </Card>
            </Link>
        </motion.div>
    )
}

export default OptionCard
