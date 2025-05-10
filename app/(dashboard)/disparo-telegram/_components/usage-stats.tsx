"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Loader2 } from "lucide-react";

interface UsageStats {
    total_messages: number;
    known_users: number;
    unknown_users: number;
    usage_by_date: {
        date: string;
        message_count: number;
        known_users: number;
        unknown_users: number;
    }[];
}

export const UsageStats = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<UsageStats | null>(null);

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/telegram/usage");
            if (!response.ok) throw new Error("Erro ao buscar estatísticas");
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error("Erro ao buscar estatísticas:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Estatísticas de Uso</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        );
    }

    if (!stats) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Estatísticas de Uso</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Nenhuma estatística disponível</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Estatísticas de Uso</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-muted/50 rounded-lg p-4">
                            <div className="text-sm font-medium text-muted-foreground">Total de Mensagens</div>
                            <div className="text-2xl font-bold">{stats.total_messages}</div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4">
                            <div className="text-sm font-medium text-muted-foreground">Usuários Conhecidos</div>
                            <div className="text-2xl font-bold">{stats.known_users}</div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4">
                            <div className="text-sm font-medium text-muted-foreground">Usuários Desconhecidos</div>
                            <div className="text-2xl font-bold">{stats.unknown_users}</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Uso por Dia</h3>
                        <div className="space-y-2">
                            {stats.usage_by_date.map((day) => (
                                <div key={day.date} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <div>
                                        <div className="font-medium">{new Date(day.date).toLocaleDateString('pt-BR')}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {day.known_users} conhecidos, {day.unknown_users} desconhecidos
                                        </div>
                                    </div>
                                    <Badge variant="secondary">{day.message_count} mensagens</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}; 