"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type Webhook = {
    id: string;
    url: string;
    eventos: {
        nova_venda: boolean;
        estoque_baixo: boolean;
        pagamento_confirmado: boolean;
        pagamento_cancelado: boolean;
    };
    ativo: boolean;
    created_at: string;
};

export default function WebhookPage() {
    const supabase = createClient();
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [novoWebhook, setNovoWebhook] = useState({
        url: "",
        eventos: {
            nova_venda: false,
            estoque_baixo: false,
            pagamento_confirmado: false,
            pagamento_cancelado: false,
        },
        ativo: true,
    });

    useEffect(() => {
        carregarWebhooks();
    }, []);

    const carregarWebhooks = async () => {
        const { data, error } = await supabase
            .from("webhooks")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            toast.error("Erro ao carregar webhooks");
            return;
        }

        setWebhooks(data || []);
    };

    const salvarWebhook = async () => {
        if (!novoWebhook.url) {
            toast.error("URL é obrigatória");
            return;
        }

        const { error } = await supabase.from("webhooks").insert([novoWebhook]);

        if (error) {
            toast.error("Erro ao salvar webhook");
            return;
        }

        toast.success("Webhook salvo com sucesso");
        setNovoWebhook({
            url: "",
            eventos: {
                nova_venda: false,
                estoque_baixo: false,
                pagamento_confirmado: false,
                pagamento_cancelado: false,
            },
            ativo: true,
        });
        carregarWebhooks();
    };

    const toggleWebhook = async (id: string, ativo: boolean) => {
        const { error } = await supabase
            .from("webhooks")
            .update({ ativo })
            .eq("id", id);

        if (error) {
            toast.error("Erro ao atualizar webhook");
            return;
        }

        carregarWebhooks();
    };

    const deletarWebhook = async (id: string) => {
        const { error } = await supabase.from("webhooks").delete().eq("id", id);

        if (error) {
            toast.error("Erro ao deletar webhook");
            return;
        }

        toast.success("Webhook deletado com sucesso");
        carregarWebhooks();
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Configuração de Webhooks</h1>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Novo Webhook</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <Label>URL do Webhook</Label>
                            <Input
                                value={novoWebhook.url}
                                onChange={(e) =>
                                    setNovoWebhook({ ...novoWebhook, url: e.target.value })
                                }
                                placeholder="https://seu-servidor.com/webhook"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Eventos</Label>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={novoWebhook.eventos.nova_venda}
                                    onCheckedChange={(checked) =>
                                        setNovoWebhook({
                                            ...novoWebhook,
                                            eventos: { ...novoWebhook.eventos, nova_venda: checked },
                                        })
                                    }
                                />
                                <Label>Nova Venda</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={novoWebhook.eventos.estoque_baixo}
                                    onCheckedChange={(checked) =>
                                        setNovoWebhook({
                                            ...novoWebhook,
                                            eventos: { ...novoWebhook.eventos, estoque_baixo: checked },
                                        })
                                    }
                                />
                                <Label>Estoque Baixo</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={novoWebhook.eventos.pagamento_confirmado}
                                    onCheckedChange={(checked) =>
                                        setNovoWebhook({
                                            ...novoWebhook,
                                            eventos: {
                                                ...novoWebhook.eventos,
                                                pagamento_confirmado: checked,
                                            },
                                        })
                                    }
                                />
                                <Label>Pagamento Confirmado</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={novoWebhook.eventos.pagamento_cancelado}
                                    onCheckedChange={(checked) =>
                                        setNovoWebhook({
                                            ...novoWebhook,
                                            eventos: {
                                                ...novoWebhook.eventos,
                                                pagamento_cancelado: checked,
                                            },
                                        })
                                    }
                                />
                                <Label>Pagamento Cancelado</Label>
                            </div>
                        </div>

                        <Button onClick={salvarWebhook}>Salvar Webhook</Button>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                {webhooks.map((webhook) => (
                    <Card key={webhook.id}>
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <p className="font-medium">{webhook.url}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(webhook.eventos).map(([evento, ativo]) => (
                                            ativo && (
                                                <span
                                                    key={evento}
                                                    className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm"
                                                >
                                                    {evento.replace("_", " ")}
                                                </span>
                                            )
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            checked={webhook.ativo}
                                            onCheckedChange={(checked) =>
                                                toggleWebhook(webhook.id, checked)
                                            }
                                        />
                                        <Label>{webhook.ativo ? "Ativo" : "Inativo"}</Label>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        onClick={() => deletarWebhook(webhook.id)}
                                    >
                                        Deletar
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
} 