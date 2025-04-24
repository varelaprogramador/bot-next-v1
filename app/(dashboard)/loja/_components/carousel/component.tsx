"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { MediaProps } from "@/app/utils/media"
import { DataTableMediaCarousel } from "@/app/components/tabela-loja"
import { Button } from "@/app/components/ui/button"
import { ChevronLeft, ChevronRight, Plus, Info } from "lucide-react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/app/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert"
import { Skeleton } from "@/app/components/ui/skeleton"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"

export default function Carousel() {
  const carouselRef = useRef<HTMLDivElement | null>(null)
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<MediaProps[]>([])
  const [dataGift, setDataGift] = useState<MediaProps[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)

  const handleScroll = (direction: "left" | "right") => {
    const container = carouselRef.current
    if (!container) return

    const itemWidth = 120 // Width of each item + gap
    const scrollAmount = direction === "left" ? -itemWidth * 3 : itemWidth * 3

    container.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    })

    // Update current slide for indicators
    const newPosition = container.scrollLeft + scrollAmount
    const approximateIndex = Math.round(newPosition / itemWidth)
    setCurrentSlide(Math.max(0, Math.min(approximateIndex, dataGift.length - 1)))
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.from("marca").select("*")

        if (error) {
          throw error
        }

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
    const subscription = supabase.channel(`realtime:public:marca`).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "marca",
      },
      (payload) => {
        setData((prevData) => {
          switch (payload.eventType) {
            case "INSERT":
              return [...prevData, payload.new as MediaProps]
            case "UPDATE":
              return prevData.map((item) => (item.id === payload.new.id ? (payload.new as MediaProps) : item))
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

  useEffect(() => {
    const loadGiftData = async () => {
      try {
        const { data, error } = await supabase.from("marca").select("*")

        if (error) {
          throw error
        }

        setDataGift(data.filter((item) => item.status === true) || [])
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      }
    }

    loadGiftData()
  }, [supabase, data])

  return (
    <div className="w-full">
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="preview">Prévia</TabsTrigger>
          <TabsTrigger value="manage">Gerenciar</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prévia do Carousel</CardTitle>
              <CardDescription>Visualize como o carousel de giftcards aparecerá na sua loja</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-card border rounded-md p-6">
                <h2 className="text-2xl font-bold mb-6">Escolha seu Giftcard</h2>

                <div className="relative bg-muted/30 p-4 rounded-md">
                  {loading ? (
                    <div className="flex gap-4 py-4 px-8">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                          <Skeleton className="h-24 w-24 rounded-full" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div
                        ref={carouselRef}
                        className="flex overflow-x-hidden gap-4 py-4 px-8 scroll-smooth"
                        style={{ scrollbarWidth: "none" }}
                      >
                        {dataGift.length > 0 ? (
                          dataGift.map((card) => (
                            <motion.div
                              key={card.id}
                              whileHover={{ scale: 1.05 }}
                              className="flex flex-col items-center gap-2"
                            >
                              <div className="flex-shrink-0 w-24 h-24 rounded-full overflow-hidden border-2 border-muted hover:border-primary cursor-pointer transition-all duration-200">
                                <Image
                                  src={card.url || "/placeholder.svg?height=100&width=100&query=gift card"}
                                  alt={card.nome || "Gift Card"}
                                  width={100}
                                  height={100}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                              <span className="text-sm font-medium">{card.nome}</span>
                            </motion.div>
                          ))
                        ) : (
                          <div className="flex items-center justify-center w-full py-8">
                            <p className="text-muted-foreground">Nenhum giftcard ativo disponível</p>
                          </div>
                        )}
                      </div>

                      {dataGift.length > 4 && (
                        <>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100 shadow-sm"
                            onClick={() => handleScroll("left")}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100 shadow-sm"
                            onClick={() => handleScroll("right")}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <p className="text-sm text-muted-foreground">
                {dataGift.length} giftcards ativos de {data.length} total
              </p>
            </CardFooter>
          </Card>

          <Alert className="bg-card border-blue-200 dark:border-blue-900">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertTitle>Dica</AlertTitle>
            <AlertDescription>
              Apenas giftcards com status ativo serão exibidos no carousel da loja. Você pode ativar ou desativar
              giftcards na aba &quot;Gerenciar&quot;.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Gerenciar Giftcards</span>
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Novo
                </Button>
              </CardTitle>
              <CardDescription>Adicione, edite ou remova giftcards do carousel</CardDescription>
            </CardHeader>
            <CardContent>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <DataTableMediaCarousel data={data} />
              </motion.div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
