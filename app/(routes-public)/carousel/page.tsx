"use client";

import EmblaCarousel from "@/app/components/carousel-emblar";
import SimpleSlider from "@/app/components/carousel-slick";
import { MediaBannerProps } from "@/app/utils/media";
import { useIsMobile } from "@/hooks/use-mobile";
import { createClient } from "@/lib/supabase/client";
import { EmblaOptionsType } from 'embla-carousel'
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
export default function Test() {

  const OPTIONS: EmblaOptionsType = { loop: true }
  const SLIDE_COUNT = 5

  const [dataBannerDesk, setDataBannerDesk] = useState<MediaBannerProps[]>([]);
  const [dataBannerNote, setDataBannerNote] = useState<MediaBannerProps[]>([]);
  const [dataBanner, setDataBanner] = useState<MediaBannerProps[]>([]);

  const supabase = createClient();
  const mobile = useIsMobile();

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data, error } = await supabase.from("media-loja").select("*");
        if (error) throw error;

        setDataBannerDesk(data.filter((item) => item.type === "desktop"));
        setDataBannerNote(data.filter((item) => item.type === "mobile"));
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    setDataBanner(mobile ? dataBannerNote : dataBannerDesk);
  }, [dataBannerDesk, dataBannerNote, mobile]);
  const SLIDES = dataBanner.map((card) => (
    <Link key={card.id} href={`/card/${card.id}`} className="w-full flex-shrink-0 h-[400px] rounded-md">
      <Image
        src={card.url || "/placeholder.svg"}
        unoptimized
        alt={card.nome}
        width={1800}
        height={300}
        className="w-full h-[400px] rounded-md object-cover bg-center"
      />
    </Link>

  ))

  return (
    <div className="min-h-screen ">
      <EmblaCarousel slides={SLIDES} options={OPTIONS}></EmblaCarousel>



    </div>
  );
}
