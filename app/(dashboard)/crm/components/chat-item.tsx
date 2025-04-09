import { Avatar } from "@/app/components/ui/avatar"
import { Card } from "@/app/components/ui/card"

interface ChatItemProps {
    name: string
    lastMessage: string
    time: string
    unread: number
}

export const ChatItem = ({ name, lastMessage, time, unread }: ChatItemProps) => {
    return (
        <Card className="p-4 hover:bg-accent cursor-pointer">
            <div className="flex items-center gap-4">
                <Avatar>
                    <div className="h-10 w-10 rounded-full bg-primary" />
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                        <h3 className="font-medium truncate">{name}</h3>
                        <span className="text-xs text-muted-foreground">{time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{lastMessage}</p>
                </div>
                {unread > 0 && (
                    <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {unread}
                    </div>
                )}
            </div>
        </Card>
    )
} 