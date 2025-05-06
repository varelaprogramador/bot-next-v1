"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type WebhookLog = {
    id: string;
    webhook_id: string;
    evento: string;
    payload: any;
    status: number;
    response: string;
    created_at: string;
    webhook_url: string;
};

export default function WebhookLogsPage() {
    const [logs, setLogs] = useState<WebhookLog[]>([]);

    useEffect(() => {
        carregarLogs();
    }, []);

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
            .limit(100);

        if (error) {
            console.error("Erro ao carregar logs:", error);
            return;
        }

        setLogs(
            data.map((log) => ({
                ...log,
                webhook_url: log.webhooks.url,
            }))
        );
    };

    const getStatusColor = (status: number) => {
        if (status >= 200 && status < 300) return "bg-green-500";
        if (status >= 400 && status < 500) return "bg-yellow-500";
        return "bg-red-500";
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Logs de Webhooks</h1>

            <div className="space-y-4">
                {logs.map((log) => (
                    <Card key={log.id}>
                        <CardContent className="pt-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium">{log.webhook_url}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(log.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <Badge className={getStatusColor(log.status)}>
                                        {log.status}
                                    </Badge>
                                </div>

                                <div className="mt-2">
                                    <p className="text-sm font-medium">Evento:</p>
                                    <p className="text-sm">{log.evento}</p>
                                </div>

                                <div className="mt-2">
                                    <p className="text-sm font-medium">Payload:</p>
                                    <pre className="text-sm bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                                        {JSON.stringify(log.payload, null, 2)}
                                    </pre>
                                </div>

                                {log.response && (
                                    <div className="mt-2">
                                        <p className="text-sm font-medium">Resposta:</p>
                                        <pre className="text-sm bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                                            {log.response}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
} 