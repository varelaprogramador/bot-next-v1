"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Clock, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import Link from "next/link"

type WebhookLog = {
    id: string
    webhook_id: string
    evento: string
    payload: any
    status: number
    response: string
    created_at: string
    webhook_url?: string
}

export default function WebhookLogPage() {
    const params = useParams()
    const supabase = createClient()
    const [logs, setLogs] = useState<WebhookLog[]>([])
    const [webhookUrl, setWebhookUrl] = useState<string>("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (params.id) {
            carregarLogs()
        }
    }, [params.id])

    const carregarLogs = async () => {
        try {
            console.log("Buscando logs do webhook:", params.id)

            // Primeiro, buscar a URL do webhook
            const { data: webhookData, error: webhookError } = await supabase
                .from("webhooks")
                .select("url")
                .eq("id", params.id)
                .single()

            if (webhookError) {
                console.error("Erro ao carregar webhook:", webhookError)
                toast.error(`Erro ao carregar webhook: ${webhookError.message}`)
                setLoading(false)
                return
            }

            if (!webhookData) {
                console.error("Webhook não encontrado:", params.id)
                toast.error(`Webhook não encontrado: ${params.id}`)
                setLoading(false)
                return
            }

            setWebhookUrl(webhookData.url)

            // Depois, buscar os logs
            const { data: logsData, error: logsError } = await supabase
                .from("webhook_logs")
                .select("*")
                .eq("webhook_id", params.id)
                .order("created_at", { ascending: false })

            if (logsError) {
                console.error("Erro ao carregar logs:", logsError)
                toast.error(`Erro ao carregar logs: ${logsError.message}`)
                setLoading(false)
                return
            }

            console.log("Logs encontrados:", logsData)
            setLogs(logsData || [])
        } catch (error) {
            console.error("Erro inesperado:", error)
            toast.error("Erro inesperado ao carregar logs")
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).format(date)
    }

    if (loading) {
        return (
            <div className="container mx-auto p-4">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-muted rounded" />
                    <div className="h-96 bg-muted rounded" />
                </div>
            </div>
        )
    }

    if (logs.length === 0) {
        return (
            <div className="container mx-auto p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold">Nenhum log encontrado</h1>
                    <p className="text-muted-foreground mt-2">Webhook ID: {params.id}</p>
                    <Link href="/integracao/webhook/logs">
                        <Button variant="link" className="mt-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar para logs
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4 space-y-4">
            <div className="flex items-center gap-4">
                <Link href="/integracao/webhook/logs">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Logs do Webhook</h1>
                    <p className="text-muted-foreground break-all">{webhookUrl}</p>
                </div>
            </div>

            <div className="space-y-4">
                {logs.map((log) => (
                    <Card key={log.id}>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{log.evento}</span>
                                <Badge variant={log.status >= 200 && log.status < 300 ? "default" : "destructive"}>
                                    {log.status >= 200 && log.status < 300 ? (
                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                    ) : (
                                        <XCircle className="h-4 w-4 mr-1" />
                                    )}
                                    Status: {log.status}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{formatDate(log.created_at)}</span>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">Payload</h3>
                                <pre className="bg-muted p-4 rounded-lg overflow-auto">
                                    {JSON.stringify(log.payload, null, 2)}
                                </pre>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">Resposta</h3>
                                <pre className="bg-muted p-4 rounded-lg overflow-auto">
                                    {JSON.stringify(log.response, null, 2)}
                                </pre>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
} 