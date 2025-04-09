import { Avatar } from "@/app/components/ui/avatar"
import { Card } from "@/app/components/ui/card"

interface MessageProps {
    content: string
    time: string
    isOwn: boolean
}

export const Message = ({ content, time, isOwn }: MessageProps) => {
    return (
        <div className={`flex gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
            {!isOwn && (
                <Avatar>
                    <div className="h-8 w-8 rounded-full bg-primary" />
                </Avatar>
            )}
            <div className="flex flex-col max-w-[70%]">
                <Card className={`p-3 ${isOwn ? "bg-primary text-primary-foreground" : ""}`}>
                    <p className="text-sm">{content}</p>
                </Card>
                <span className="text-xs text-muted-foreground mt-1">{time}</span>
            </div>
            {isOwn && (
                <Avatar>
                    <div className="h-8 w-8 rounded-full bg-primary" />
                </Avatar>
            )}
        </div>
    )
} 