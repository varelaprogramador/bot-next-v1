"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Separator } from "@/app/components/ui/separator"
import { ArrowLeft, ChevronLeft, ChevronRight, Home, ChevronRightIcon, ImageIcon, Info } from 'lucide-react'
import Link from "next/link"
import Image from "next/image"
import { createClientSupabaseClient } from "@/lib/supabase/client";
import type { MediaBannerProps } from "@/app/utils/media"
import { DataTableMediaBanner } from "@/app/components/tabela-loja-banner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/app/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert"
import { useIsMobile } from "@/hooks/use-mobile"
import { motion } from "framer-motion"
import { Skeleton } from "@/app/components/ui/skeleton"

export default function BannerPage() {
  const supabase = createClientSupabaseClient()
  const isMobile = useIsMobile()
  const carouselRef = useRef<HTMLDivElement | null>(null)

  const [dataBannerDesk, setDataBannerDesk] = useState<MediaBannerProps[]>([])
  const [dataBannerNote, setDataBannerNote] = useState<MediaBannerProps[]>([])
  const [data, setData] = useState<MediaBannerProps[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)

  const handleScroll = (direction: "left" | "right") => {
    const container = carouselRef.current
    if (!container) return

    const banners = isMobile ? dataBannerNote : dataBannerDesk
    const newIndex = direction === "left"
      ? Math.max(0, currentSlide - 1)
      : Math.min(banners.length - 1, currentSlide + 1)

    setCurrentSlide(newIndex)

    container.scrollTo({
      left: container.offsetWidth * newIndex,
      behavior: "smooth",
    })
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.from("media-loja").select("*")

        if (error) {
          throw error
        }

        setDataBannerDesk(data.filter((value) => value.type === "desktop"))
        setDataBannerNote(data.filter((value) => value.type === "mobile"))
        setData(data || [])
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [supabase])

  useEffect(() => {
    const subscription = supabase.channel(`realtime:public:media-loja`).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "media-loja",
      },
      (payload) => {
        setData((prevData) => {
          switch (payload.eventType) {
            case "INSERT":
              return [...prevData, payload.new as MediaBannerProps]
            case "UPDATE":
              return prevData.map((item) => (item.id === payload.new.id ? (payload.new as MediaBannerProps) : item))
            case "DELETE":
              return prevData.filter((item) => item.id !== payload.old.id)
            default:
              return prevData
          }
        })
      },
    )

    subscription.subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const banners = isMobile ? dataBannerNote : dataBannerDesk

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
          <span className="font-medium text-foreground">Banners</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Gerenciar Banners</h1>
            <p className="text-muted-foreground">Configure os banners promocionais da sua loja</p>
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Visualização do Banner
          </CardTitle>
          <CardDescription>
            Prévia de como o banner aparecerá na sua loja
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative rounded-md overflow-hidden border bg-card">
            <div
              ref={carouselRef}
              className="flex overflow-hidden scroll-smooth snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none' }}
            >
              {loading ? (
                <div className="w-full flex-shrink-0 aspect-[16/4]">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : banners.length > 0 ? (
                banners.map((banner) => (
                  <div
                    key={banner.id}
                    className="w-full flex-shrink-0 snap-center"
                  >
                    <Image
                      src={banner.url || "/placeholder.svg?height=400&width=1500&query=banner"}
                      alt={banner.nome || "Banner"}
                      width={1500}
                      height={400}
                      className="w-full object-cover aspect-[16/4]"
                      priority
                    />
                  </div>
                ))
              ) : (
                <div className="w-full flex-shrink-0 aspect-[16/4] bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">Nenhum banner disponível</p>
                </div>
              )}
            </div>

            {banners.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100 shadow-md"
                  onClick={() => handleScroll("left")}
                  disabled={currentSlide === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100 shadow-md"
                  onClick={() => handleScroll("right")}
                  disabled={currentSlide === banners.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {banners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${index === currentSlide
                      ? "bg-primary w-4"
                      : "bg-primary/30 hover:bg-primary/50"
                      }`}
                    onClick={() => {
                      setCurrentSlide(index)
                      carouselRef.current?.scrollTo({
                        left: carouselRef.current.offsetWidth * index,
                        behavior: "smooth",
                      })
                    }}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Alert className="mb-6 bg-card border-amber-200 dark:border-amber-900">
        <Info className="h-4 w-4 text-amber-500" />
        <AlertTitle>Dimensões recomendadas</AlertTitle>
        <AlertDescription className="flex flex-col gap-1">
          <p><strong>Desktop:</strong> 1500 × 400 pixels</p>
          <p><strong>Mobile:</strong> 380 × 400 pixels</p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Banners</CardTitle>
          <CardDescription>
            Adicione, edite ou remova banners da sua loja
          </CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <DataTableMediaBanner data={data} />
          </motion.div>
        </CardContent>
      </Card>
    </div>
  )
}
