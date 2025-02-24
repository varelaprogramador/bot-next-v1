"use client";

import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { Info, MessagesSquare, ShoppingBag } from "lucide-react";
import Link from "next/link";


export default function Duvidas() {

    return (

        <div className=" flex flex-col  bg-white rounded-md min-h-[70vh] px-60 max-md:p-4 mx-auto py-8 gap-4">
            <h2 className="text-2xl font-semibold">Perguntas frequêntes</h2>
            <Separator></Separator>
            <div className="w-full  p-4 bg-[#f7f7f7] rounded-md flex flex-col gap-4">
                <div className="flex gap-4 items-center"> <Info fill="#1976D2" color="white" size={35}></Info> <h1 className="text-xl text-slate-900 font-semibold">Não encontrou o que precisava ?</h1></div>
                <p>Utilize nossos canais de atendimento. Nossa equipe está pronta para ajudá-lo e responder a todas as suas perguntas.</p>
                <div className="flex max-md:flex-col gap-4">   <Link href={process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT || ""}>
                    <Button variant="sucess" className="flex-1">
                        <MessagesSquare className="mr-2 h-4 w-full" />
                        Suporte via WhatsApp
                    </Button>
                </Link>   <Link href={process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT || ""}>
                        <Button className="flex-1 bg-blue-500 hover:bg-blue-400">
                            <MessagesSquare className="mr-2 h-4 w-full" />
                            Suporte via Telegram
                        </Button></Link></div>

            </div>
        </div>

    );
}
