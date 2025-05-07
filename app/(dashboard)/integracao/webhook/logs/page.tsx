"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ExternalLink } from "lucide-react"

type WebhookLog = {
    id: string
    webhook_id: string
    evento: string
    payload: any
    status: number
    response: string
    created_at: string
    webhook_url: string
}

export default function WebhookLogsPage() {
    const supabase = createClientSupabaseClient()
    const [logs, setLogs] = useState<WebhookLog[]>([])

    useEffect(() => {
        carregarLogs()
    }, [])

    const carregarLogs = async () => {
        const { data, error } = await supabase
            .from("webhook_logs")
            .select(`
        *,
        webhooks (
          url
        )
      `)
            .order("created_at", { ascending: false })
            .limit(100)

        if (error) {
            console.error("Erro ao carregar logs:", error)
            return
        }

        setLogs(
            data.map((log: WebhookLog) => ({
                ...log,
                webhook_url: log.webhook_url,
            })),
        )
    }

    const getStatusColor = (status: number) => {
        if (status >= 200 && status < 300) return "bg-green-500/80 dark:bg-green-600"
        if (status >= 400 && status < 500) return "bg-yellow-500/80 dark:bg-yellow-600"
        return "bg-red-500/80 dark:bg-red-600"
    }

    const formatJSON = (json: any) => {
        try {
            if (typeof json === "string") {
                return JSON.stringify(JSON.parse(json), null, 2)
            }
            return JSON.stringify(json, null, 2)
        } catch (e) {
            return String(json)
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
        }).format(date)
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6 text-foreground">Logs de Webhooks</h1>

            <div className="space-y-4">
                {logs.map((log) => (
                    <Link href={`/integracao/webhook/logs/${log.id}`} key={log.id}>
                        <Card className="border border-border hover:border-primary/50 transition-colors">
                            <CardContent className="pt-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-foreground">{log.webhook_url}</p>
                                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm text-muted-foreground">{formatDate(log.created_at)}</p>
                                        </div>
                                        <Badge className={getStatusColor(log.status)}>{log.status}</Badge>
                                    </div>

                                    <div className="mt-2">
                                        <p className="text-sm font-medium text-foreground">Evento:</p>
                                        <p className="text-sm text-foreground">{log.evento}</p>
                                    </div>

                                    <div className="mt-2">
                                        <p className="text-sm font-medium text-foreground">Payload:</p>
                                        <pre className="text-sm bg-muted p-2 rounded mt-1 overflow-x-auto text-foreground whitespace-pre-wrap">
                                            {formatJSON(log.payload)}
                                        </pre>
                                    </div>

                                    {log.response && (
                                        <div className="mt-2">
                                            <p className="text-sm font-medium text-foreground">Resposta:</p>
                                            <pre className="text-sm bg-muted p-2 rounded mt-1 overflow-x-auto text-foreground whitespace-pre-wrap">
                                                {formatJSON(log.response)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
