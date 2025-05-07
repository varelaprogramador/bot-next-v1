"use client";

import { AlertCircle, Bot, MessageCircle, Webhook } from "lucide-react";
import Link from "next/link";

interface OptionCardIntegraProps {
    title: string;
    icon: string;
    link: string;
}

const OptionCardIntegra: React.FC<OptionCardIntegraProps> = ({ title, icon, link }) => {
    const getIcon = () => {
        switch (icon) {
            case 'bot':
                return <Bot size={36} />;
            case 'webhook':
                return <Webhook size={36} />;
            case 'message':
                return <MessageCircle size={36} />;
            case 'warning':
                return <AlertCircle size={36} />;
            default:
                return null;
        }
    };

    return (<Link href={link}>
        <article className="border rounded-md flex flex-col justify-between items-center min-h-[350px] p-4 hover:scale-110 transition-all">
            <header className="flex justify-end items-end w-full"> <div className="p-2 bg-emerald-500 rounded-md  text-xs animate-pulse">
                ativo</div></header>
            <div className="flex flex-col justify-center items-center gap-4 ">
                {getIcon()}
                <p>{title}</p>
            </div>
            <footer>

            </footer>
        </article>
    </Link>
    );
};

export default OptionCardIntegra;