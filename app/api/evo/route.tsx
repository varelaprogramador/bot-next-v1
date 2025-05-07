"use server";

import { evolutionApi } from "@/app/utils/evolutionApi";
import { contactManager } from "@/app/utils/contact-manager";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        // Busca todos os contatos ativos
        const contacts = await contactManager.listAllContacts();

        console.log(contacts, "contacts");

        // Envia a mensagem para cada contato
        const results = await Promise.allSettled(
            contacts.map(async (contact) => {
                try {
                    await evolutionApi.sendMessage({
                        message,
                        phone: contact.whatsapp
                    });
                    return { success: true, contact };
                } catch (error) {
                    console.error(`Erro ao enviar para ${contact.whatsapp}:`, error);
                    return { success: false, contact, error };
                }
            })
        );

        // Conta sucessos e falhas
        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.length - successful;

        return NextResponse.json({
            message: "Processo de envio concluído",
            total: results.length,
            successful,
            failed,
            details: results.map(r => {
                if (r.status === 'fulfilled') {
                    return {
                        phone: r.value.contact.whatsapp,
                        success: r.value.success
                    };
                }
                return {
                    phone: r.reason.contact.whatsapp,
                    success: false,
                    error: r.reason.error?.message
                };
            })
        });
    } catch (error) {
        console.error("Erro ao processar requisição:", error);
        return NextResponse.json({
            message: "Erro ao enviar mensagens",
            error: error instanceof Error ? error.message : "Erro desconhecido"
        }, { status: 500 });
    }
}   