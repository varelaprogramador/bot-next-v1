import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

interface SummaryCardProps {
  title: string;
  value: string;
  previousValue?: string;
  previousLabel?: string;
}

export function SummaryCard({
  title,
  value,
  previousValue,
  previousLabel,
}: SummaryCardProps) {
  return (
    <Card className="bg-transparent text-theme">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {previousValue && (
          <p className="text-xs text-muted-foreground ">
            {previousLabel} {previousValue}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
