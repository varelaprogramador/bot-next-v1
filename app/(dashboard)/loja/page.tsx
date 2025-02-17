'use client';

import { DataTableMediaCarousel } from "@/app/components/tabela-loja";
import { MediaProps } from "@/app/utils/media";
import { createClient } from "@/lib/supabase/client";

import { useEffect, useState } from "react";


export default function Shop() {
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
  return (
   <div className="p-4">
    <h1 className="text-2xl font-semibold">Configure sua loja</h1>
   <h2>Layout da Loja</h2>
   <div>
    <h3 className="font-semibold">Lista do carousel de escolha do giftcard:</h3>
    
<DataTableMediaCarousel data={data}></DataTableMediaCarousel>
   </div>
    
   </div>
  );
}
