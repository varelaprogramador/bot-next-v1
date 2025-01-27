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
  colortitle?:string;
}

export function SummaryCard({
  title,
  value,
  previousValue,
  previousLabel,
  colortitle
}: SummaryCardProps) {
  return (
    <Card className="bg-transparent text-theme  shadow-none ">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold ${colortitle ? colortitle:"text-white"}`}>{value}</div>
        {previousValue && (
          <p className="text-xs text-muted-foreground ">
            {previousLabel} {previousValue}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
