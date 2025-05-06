'use client';

import { Separator } from "@/app/components/ui/separator";
import OptionCardIntegra from './_components/OptionCard';

export default function Integracao() {
    return (
        <div className="p-4 min-h-[85vh] flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Configure suas Integracoes</h1>
            </div>
            <Separator className="my-4"></Separator>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <OptionCardIntegra key={1} icon="bot" title="Bot Conversa" link="/integracao/bot-conversa" />
                <OptionCardIntegra key={2} icon="webhook" title="Webhook" link="/integracao/webhook" />
            </div>
        </div>
    );
}