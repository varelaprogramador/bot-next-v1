'use client';

import { InstanceList } from "./_components/instance-list";
import { ContactList } from "./_components/contact-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { MessageSquare, Star, Power, QrCode, Users } from "lucide-react";

export default function ConfigPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <Card className="border border-border/40 bg-background/60 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Gerenciamento de Instâncias WhatsApp</CardTitle>
                    <CardDescription>
                        Sistema de gerenciamento de múltiplas instâncias do WhatsApp via Evolution API
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-primary">
                                <Star className="h-5 w-5" />
                                <h3 className="font-semibold">Instância Padrão</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Apenas uma instância pode ser definida como padrão. Esta será usada como principal para envio de mensagens.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-green-500">
                                <Power className="h-5 w-5" />
                                <h3 className="font-semibold">Status de Conexão</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Monitoramento em tempo real do status de conexão de cada instância com o WhatsApp.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-blue-500">
                                <QrCode className="h-5 w-5" />
                                <h3 className="font-semibold">QR Code</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Geração de QR Code para conexão de novas instâncias ou reconexão de instâncias desconectadas.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-purple-500">
                                <MessageSquare className="h-5 w-5" />
                                <h3 className="font-semibold">Métricas</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Visualização de métricas importantes como número de mensagens, contatos e chats por instância.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-lg border border-border/40 bg-muted/50 p-4">
                        <h3 className="font-semibold mb-2">Como Funciona</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p>1. <span className="font-medium text-foreground">Criação:</span> Crie uma nova instância com um nome único.</p>
                            <p>2. <span className="font-medium text-foreground">Conexão:</span> Gere um QR Code e escaneie com seu WhatsApp.</p>
                            <p>3. <span className="font-medium text-foreground">Padrão:</span> Defina uma instância como padrão clicando na estrela.</p>
                            <p>4. <span className="font-medium text-foreground">Monitoramento:</span> Acompanhe o status e métricas em tempo real.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-col gap-6 ">
                <InstanceList />
                <ContactList />
            </div>
        </div>
    )
}
