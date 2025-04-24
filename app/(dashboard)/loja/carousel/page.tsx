"use client"

import { Button } from "@/app/components/ui/button"
import { Separator } from "@/app/components/ui/separator"
import { ArrowLeft, Home, ChevronRightIcon, Layers } from 'lucide-react'
import Link from "next/link"
import Carousel from "../_components/carousel/component"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/app/components/ui/card"
import { motion } from "framer-motion"

export default function CarouselLayoutShop() {
  return (
    <div className="p-4 md:p-6 min-h-[85vh] flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-primary transition-colors">
            <Home size={16} className="inline mr-1" />
            Dashboard
          </Link>
          <ChevronRightIcon size={16} className="mx-1" />
          <Link href="/loja" className="hover:text-primary transition-colors">
            Loja
          </Link>
          <ChevronRightIcon size={16} className="mx-1" />
          <span className="font-medium text-foreground">Carousel</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Gerenciar Carousel</h1>
            <p className="text-muted-foreground">Configure os carrosséis de produtos e categorias</p>
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link href="/loja" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Voltar para Loja
            </Link>
          </Button>
        </div>
      </div>

      <Separator className="my-4" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Configuração do Carousel
            </CardTitle>
            <CardDescription>
              Gerencie os itens exibidos nos carrosséis da sua loja
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Carousel />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
