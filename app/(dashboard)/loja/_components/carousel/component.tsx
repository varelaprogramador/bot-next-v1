'use client';

import { DataTableMediaCarousel } from "@/app/components/tabela-loja";
import { Button } from "@/app/components/ui/button";
import { MediaProps } from "@/app/utils/media";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Separator } from "@/app/components/ui/separator";


export default function Carousel() {
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const handleScroll = (direction: "left" | "right") => {
    const container = carouselRef.current;
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
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MediaProps[]>([]);
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("marca").select("*");

        if (error) {
          throw error;
        }

        setData(data || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabase]);

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
              return [...prevData, payload.new as MediaProps];
            case "UPDATE":
              return prevData.map((item) =>
                item.id === payload.new.id ? (payload.new as MediaProps) : item
              );
            case "DELETE":
              return prevData.filter((item) => item.id !== payload.old.id);
            default:
              return prevData;
          }
        });
      }
    );

    subscription.subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);
  const [dataGift, setDataGift] = useState<MediaProps[]>([]);
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("marca").select("*");

        if (error) {
          throw error;
        }

        setDataGift(data.filter((item) => item.status === true) || []);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [supabase]);
  return (

    <div className="w-full">
      <Separator className="my-6"></Separator>
      <h3 className="font-semibold my-6">Previa do giftcard :</h3>
      <section className="mb-12 bg-white border p-4 rounded-md">
        <h2 className="text-2xl font-bold mb-6">Escolha seu Giftcard</h2>
        <div className="relative bg-gray-100 p-4 rounded-md">
          <div
            ref={carouselRef}
            className="flex   overflow-x-hidden gap-4 py-4 px-8"
          >
            {dataGift.map((card) => (

              <Link key={card.id} href={`/card/${card.id}`} target="_blank">
                <div
                  key={card.id + "-" + "pai"}
                  className=" flex flex-col justify-center items-center gap-2"
                >
                  <div
                    key={card.id}
                    className="flex-shrink-0 w-[100px] rounded-full overflow-hidden border-2 border-gray-200 hover:border-blue-500 cursor-pointer flex justify-center items-center"
                  >
                    <Image
                      src={card.url || "/placeholder.svg"}
                      alt={card.nome}
                      width={100}
                      height={100}
                      className="object-cover w-full h-full"
                    />

                  </div>


                </div>
              </Link>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-5 top-1/2 -translate-y-1/2 -translate-x-4 rounded-full"
            onClick={() => handleScroll("left")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-5  top-1/2 -translate-y-1/2 translate-x-4 rounded-full"
            onClick={() => handleScroll("right")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
      <h3 className="font-semibold">Lista do carousel de escolha do giftcard:</h3>
      <DataTableMediaCarousel data={data}></DataTableMediaCarousel>
    </div>


  );
}
