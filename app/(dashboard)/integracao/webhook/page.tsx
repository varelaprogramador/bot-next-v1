"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
    PlusCircle,
    Trash2,
    ExternalLink,
    Activity,
    ToggleLeft,
    ToggleRight,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
} from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/app/components/ui/card"
import { Switch } from "@/app/components/ui/switch"
import { Label } from "@/app/components/ui/label"
import { Badge } from "@/app/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip"
import { toast } from "sonner"
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/app/components/ui/collapsible"
import { Skeleton } from "@/app/components/ui/skeleton"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/app/components/ui/dialog"

type Webhook = {
    id: string
    url: string
    eventos: {
        nova_venda: boolean
        estoque_baixo: boolean
        pagamento_confirmado: boolean
        pagamento_cancelado: boolean
    }
    ativo: boolean
    created_at: string
}

const eventIcons = {
    nova_venda: <CheckCircle2 className="h-4 w-4" />,
    estoque_baixo: <AlertTriangle className="h-4 w-4" />,
    pagamento_confirmado: <CheckCircle2 className="h-4 w-4" />,
    pagamento_cancelado: <XCircle className="h-4 w-4" />,
}

const eventLabels = {
    nova_venda: "Nova Venda",
    estoque_baixo: "Estoque Baixo",
    pagamento_confirmado: "Pagamento Confirmado",
    pagamento_cancelado: "Pagamento Cancelado",
}

export default function WebhookPage() {
    const supabase = createClientSupabaseClient()
    const [webhooks, setWebhooks] = useState<Webhook[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedWebhook, setExpandedWebhook] = useState<string | null>(null)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

    const [novoWebhook, setNovoWebhook] = useState({
        url: "",
        eventos: {
            nova_venda: false,
            estoque_baixo: false,
            pagamento_confirmado: false,
            pagamento_cancelado: false,
        },
        ativo: true,
    })

    useEffect(() => {
        carregarWebhooks()
    }, [])

    const carregarWebhooks = async () => {
        setLoading(true)
        const { data, error } = await supabase.from("webhooks").select("*").order("created_at", { ascending: false })

        if (error) {
            toast.error("Erro ao carregar webhooks")
            setLoading(false)
            return
        }

        setWebhooks(data || [])
        setLoading(false)
    }

    const salvarWebhook = async () => {
        if (!novoWebhook.url) {
            toast.error("URL é obrigatória")
            return
        }

        // Verificar se pelo menos um evento está selecionado
        const temEventoSelecionado = Object.values(novoWebhook.eventos).some((value) => value)
        if (!temEventoSelecionado) {
            toast.error("Selecione pelo menos um evento")
            return
        }

        toast.promise(
            async () => {
                const { error } = await supabase.from("webhooks").insert([novoWebhook])
                if (error) throw new Error(error.message)

                setNovoWebhook({
                    url: "",
                    eventos: {
                        nova_venda: false,
                        estoque_baixo: false,
                        pagamento_confirmado: false,
                        pagamento_cancelado: false,
                    },
                    ativo: true,
                })

                await carregarWebhooks()
            },
            {
                loading: "Salvando webhook...",
                success: "Webhook salvo com sucesso!",
                error: (err) => `Erro ao salvar webhook: ${err.message}`,
            },
        )
    }

    const toggleWebhook = async (id: string, ativo: boolean) => {
        toast.promise(
            async () => {
                const { error } = await supabase.from("webhooks").update({ ativo }).eq("id", id)

                if (error) throw new Error(error.message)
                await carregarWebhooks()
            },
            {
                loading: "Atualizando status...",
                success: `Webhook ${ativo ? "ativado" : "desativado"} com sucesso!`,
                error: (err) => `Erro ao atualizar webhook: ${err.message}`,
            },
        )
    }

    const deletarWebhook = async (id: string) => {
        toast.promise(
            async () => {
                const { error } = await supabase.from("webhooks").delete().eq("id", id)
                if (error) throw new Error(error.message)
                setDeleteConfirmId(null)
                await carregarWebhooks()
            },
            {
                loading: "Deletando webhook...",
                success: "Webhook deletado com sucesso!",
                error: (err) => `Erro ao deletar webhook: ${err.message}`,
            },
        )
    }

    const toggleExpand = (id: string) => {
        setExpandedWebhook(expandedWebhook === id ? null : id)
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date)
    }

    const countActiveEvents = (eventos: Webhook["eventos"]) => {
        return Object.values(eventos).filter(Boolean).length
    }

    return (
        <div className="container mx-auto p-4 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Webhooks</h1>
                    <p className="text-muted-foreground mt-1">Configure integrações com sistemas externos</p>
                </div>
                <Link href="/webhook-logs">
                    <Button variant="outline" className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Ver Logs
                    </Button>
                </Link>
            </div>

            <Card className="border border-border">
                <CardHeader>
                    <CardTitle className="text-xl">Novo Webhook</CardTitle>
                    <CardDescription>Configure um novo endpoint para receber notificações</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="webhook-url">URL do Webhook</Label>
                            <Input
                                id="webhook-url"
                                value={novoWebhook.url}
                                onChange={(e) => setNovoWebhook({ ...novoWebhook, url: e.target.value })}
                                placeholder="https://seu-servidor.com/webhook"
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>Eventos</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(novoWebhook.eventos).map(([key, value]) => (
                                    <div key={key} className="flex items-center space-x-3 p-3 rounded-lg border border-border">
                                        <Switch
                                            checked={value}
                                            onCheckedChange={(checked) =>
                                                setNovoWebhook({
                                                    ...novoWebhook,
                                                    eventos: { ...novoWebhook.eventos, [key]: checked },
                                                })
                                            }
                                        />
                                        <div className="flex items-center gap-2">
                                            {eventIcons[key as keyof typeof eventIcons]}
                                            <Label
                                                className="font-medium cursor-pointer"
                                                onClick={() =>
                                                    setNovoWebhook({
                                                        ...novoWebhook,
                                                        eventos: { ...novoWebhook.eventos, [key]: !value },
                                                    })
                                                }
                                            >
                                                {eventLabels[key as keyof typeof eventLabels]}
                                            </Label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={salvarWebhook} className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Adicionar Webhook
                    </Button>
                </CardFooter>
            </Card>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Webhooks Configurados</h2>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <Card key={i} className="border border-border">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-5 w-full max-w-md" />
                                            <div className="flex flex-wrap gap-2">
                                                <Skeleton className="h-6 w-20" />
                                                <Skeleton className="h-6 w-20" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="h-8 w-16" />
                                            <Skeleton className="h-8 w-20" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : webhooks.length === 0 ? (
                    <Card className="border border-border">
                        <CardContent className="pt-6 flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-muted p-3 mb-4">
                                <ExternalLink className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">Nenhum webhook configurado</h3>
                            <p className="text-muted-foreground max-w-md">
                                Adicione seu primeiro webhook para começar a receber notificações em tempo real.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {webhooks.map((webhook) => (
                            <Card
                                key={webhook.id}
                                className={`border transition-all duration-200 ${webhook.ativo ? "border-border" : "border-border bg-muted/30"}`}
                            >
                                <CardContent className="pt-6">
                                    <Collapsible open={expandedWebhook === webhook.id}>
                                        <div className="flex flex-col md:flex-row justify-between gap-4">
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <CollapsibleTrigger asChild onClick={() => toggleExpand(webhook.id)}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            {expandedWebhook === webhook.id ? (
                                                                <ChevronUp className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </CollapsibleTrigger>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-foreground break-all">{webhook.url}</p>
                                                        <Badge variant={webhook.ativo ? "default" : "outline"} className="ml-2">
                                                            {webhook.ativo ? "Ativo" : "Inativo"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2 ml-8">
                                                    {countActiveEvents(webhook.eventos) > 0 ? (
                                                        Object.entries(webhook.eventos).map(
                                                            ([evento, ativo]) =>
                                                                ativo && (
                                                                    <Badge key={evento} variant="secondary" className="flex items-center gap-1">
                                                                        {eventIcons[evento as keyof typeof eventIcons]}
                                                                        <span>{eventLabels[evento as keyof typeof eventLabels]}</span>
                                                                    </Badge>
                                                                ),
                                                        )
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">Nenhum evento configurado</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-8 md:ml-0">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => toggleWebhook(webhook.id, !webhook.ativo)}
                                                            >
                                                                {webhook.ativo ? (
                                                                    <ToggleRight className="h-5 w-5 text-primary" />
                                                                ) : (
                                                                    <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                                                                )}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>{webhook.ativo ? "Desativar webhook" : "Ativar webhook"}</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>

                                                <Dialog
                                                    open={deleteConfirmId === webhook.id}
                                                    onOpenChange={(open) => !open && setDeleteConfirmId(null)}
                                                >
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(webhook.id)}>
                                                            <Trash2 className="h-5 w-5 text-destructive" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Confirmar exclusão</DialogTitle>
                                                            <DialogDescription>
                                                                Tem certeza que deseja excluir este webhook? Esta ação não pode ser desfeita.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <DialogFooter>
                                                            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                                                                Cancelar
                                                            </Button>
                                                            <Button variant="destructive" onClick={() => deletarWebhook(webhook.id)}>
                                                                Excluir
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>

                                                <Link href={`/integracao/webhook/logs/${webhook.id}`}>
                                                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                                                        <Activity className="h-4 w-4" />
                                                        Logs
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>

                                        <CollapsibleContent>
                                            <div className="mt-4 ml-8 space-y-4 border-t pt-4 border-border">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <h4 className="text-sm font-medium mb-2 text-foreground">Detalhes</h4>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                                <span className="text-muted-foreground">
                                                                    Criado em: {formatDate(webhook.created_at)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant={webhook.ativo ? "default" : "outline"} className="h-5">
                                                                    {webhook.ativo ? "Ativo" : "Inativo"}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-sm font-medium mb-2 text-foreground">Eventos configurados</h4>
                                                        <div className="space-y-2">
                                                            {Object.entries(webhook.eventos).map(([evento, ativo]) => (
                                                                <div key={evento} className="flex items-center gap-2">
                                                                    <div className={`w-3 h-3 rounded-full ${ativo ? "bg-primary" : "bg-muted"}`}></div>
                                                                    <span className={ativo ? "text-foreground" : "text-muted-foreground"}>
                                                                        {eventLabels[evento as keyof typeof eventLabels]}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => toggleWebhook(webhook.id, !webhook.ativo)}>
                                                        {webhook.ativo ? "Desativar" : "Ativar"}
                                                    </Button>
                                                    <Button variant="destructive" size="sm" onClick={() => setDeleteConfirmId(webhook.id)}>
                                                        Excluir
                                                    </Button>
                                                </div>
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
