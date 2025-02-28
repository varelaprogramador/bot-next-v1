'use client';

import { DataTableMediaCarousel } from "@/app/components/tabela-loja";
import { Button } from "@/app/components/ui/button";
import { MediaBannerProps, MediaProps } from "@/app/utils/media";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Separator } from "@/app/components/ui/separator";
import Carousel from "./_components/carousel/component";
import { useIsMobile } from "@/hooks/use-mobile";

import { EmblaOptionsType } from 'embla-carousel'
import EmblaCarousel from "@/app/components/model-carousel/EmblaCarousel";

export default function Shop() {
  const supabase = createClient();

  const [dataBannerDesk, setDataBannerDesk] = useState<MediaBannerProps[]>([]);
  const [dataBannerNote, setDataBannerNote] = useState<MediaBannerProps[]>([]);
  const carouselRef2 = useRef<HTMLDivElement | null>(null);
  const handleScroll2 = (direction: "left" | "right") => {
    const container = carouselRef2.current;
    if (!container) return; // Verificar se o container existe

    if (direction === "left") {
      container.scrollBy({
        left: -container.offsetWidth,
        behavior: "smooth",
      });
    } else {
      container.scrollBy({
        left: container.offsetWidth,
        behavior: "smooth",
      });
    }
  };
  useEffect(() => {
    const loadData2 = async () => {

      try {
        const { data, error } = await supabase.from("media-loja").select("*");

        if (error) {
          throw error;
        }

        setDataBannerDesk(data.filter((value) => value.type === 'desktop'));
        setDataBannerNote(data.filter((value) => value.type === 'mobile'));
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    loadData2();
  }, [supabase]);
  const mobile = useIsMobile();

  const OPTIONS: EmblaOptionsType = { dragFree: true, loop: true }
  const SLIDE_COUNT = 5
  const SLIDES = Array.from(Array(SLIDE_COUNT).keys())
  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold">Configure sua loja</h1>
      <h2>Layout da Loja</h2>
      <div>
        <h2 className="font-semibold">Banner :</h2>
        <EmblaCarousel slides={SLIDES} options={OPTIONS} />
        <div className="w-full">
          <section className=" bg-white border  rounded-md">

            <div className="relative  rounded-md ">
              <div
                ref={carouselRef2}
                className="flex overflow-hidden "
              >
                {(mobile ? dataBannerNote : dataBannerDesk)?.map((card, index) => (
                  <Link key={card.id} href={`/card/${card.id}`} className="w-full flex-shrink-0   max-h-[800px] rounded-md">
                    <Image
                      src={card.url || "/placeholder.svg"}
                      unoptimized
                      alt={card.nome}
                      width={2000}
                      height={2000}
                      className="w-full rounded-md object-fit bg-center  max-h-[800px]"
                    />
                  </Link>
                ))}

              </div>

              <Button
                variant="outline"
                size="icon"
                className="absolute left-5 top-1/2 -translate-y-1/2 -translate-x-4 rounded-full"
                onClick={() => handleScroll2("left")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-5  top-1/2 -translate-y-1/2 translate-x-4 rounded-full"
                onClick={() => handleScroll2("right")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        </div>
        <Carousel></Carousel>

      </div>

    </div>
  );
}
