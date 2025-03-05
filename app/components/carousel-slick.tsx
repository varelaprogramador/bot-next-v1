import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import { MediaBannerProps } from "../utils/media";
import { createClient } from "@/lib/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import Link from "next/link";
import Image from "next/image";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
export default function SimpleSlider() {
 const settings = {
    dots: true,
    infinite: true,
    speed: 10,
    slidesToShow: 1,
    slidesToScroll: 1,
  };
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
  return (
    <Slider {...settings}>
      {dataBanner.map((card) => (
        <Link key={card.id} href={`/card/${card.id}`} className="w-full flex-shrink-0 h-[300px] rounded-md">
          <Image
            src={card.url || "/placeholder.svg"}
            unoptimized
            alt={card.nome}
            width={1800}
            height={300}
            className="w-full h-[300px] rounded-md object-cover bg-center"
          />
        </Link>
      ))}
    </Slider>
  );
}