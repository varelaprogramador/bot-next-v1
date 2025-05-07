"use client";

import EmblaCarousel from "@/app/components/carousel-emblar";

import { MediaBannerProps, MediaProps } from "@/app/utils/media";
import { useIsMobile } from "@/hooks/use-mobile";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { EmblaOptionsType } from 'embla-carousel'
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import EmblaCarouselCircle from "@/app/components/carousel-emblar-circle";
export default function Test() {

  const OPTIONS: EmblaOptionsType = { loop: true, duration: 100 }
  const OPTIONS2: EmblaOptionsType = { loop: true, duration: 100 }
  const [dataBannerDesk, setDataBannerDesk] = useState<MediaBannerProps[]>([]);
  const [dataBannerMobile, setDataBannerMobile] = useState<MediaBannerProps[]>([]);
  const [dataBanner, setDataBanner] = useState<MediaBannerProps[]>([]);

  const supabase = createClientSupabaseClient();
  const mobile = useIsMobile();

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data, error } = await supabase.from("media-loja").select("*");
        if (error) throw error;

        setDataBannerDesk(data.filter((item) => item.type === "desktop"));
        setDataBannerMobile(data.filter((item) => item.type === "mobile"));
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    setDataBanner(mobile ? dataBannerMobile : dataBannerDesk);
  }, [dataBannerDesk, dataBannerMobile, mobile]);


  const [dataGift, setDataGift] = useState<MediaProps[]>([]);
  useEffect(() => {
    const loadData = async () => {

      try {
        const { data, error } = await supabase.from("marca").select("*");

        if (error) {
          throw error;
        }

        setDataGift(data.filter((item) => item.status === true) || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    loadData();
  }, [supabase]);
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
  const SLIDES2 = dataGift.map((card) => (
    <Link key={card.id} href={`/card/${card.id}`}>
      <div
        key={card.id + "-" + "pai"}
        className=" flex flex-col justify-center items-center gap-2"
      >
        <div
          key={card.id}
          className="flex-shrink-0 w-[90px] rounded-full overflow-hidden border-2 border-gray-200 hover:border-blue-500 cursor-pointer flex justify-center items-center"
        >
          <Image
            src={card.url || "/placeholder.svg"}
            alt={card.nome}
            width={90}
            height={90}
            className="object-cover w-full h-full"
          />

        </div>


      </div>
    </Link>

  ))

  return (
    <div className="min-h-screen ">
      <EmblaCarousel slides={SLIDES} options={OPTIONS} />
      <EmblaCarouselCircle slides={SLIDES2} options={OPTIONS2} />

    </div>
  );
}
