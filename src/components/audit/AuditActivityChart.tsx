import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HourlyData {
  hour: string;
  count: number;
}

interface TableData {
  name: string;
  value: number;
}

interface UserData {
  email: string;
  count: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--muted))",
  "hsl(210, 70%, 50%)",
];

export function AuditActivityChart() {
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [userData, setUserData] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: logs, error } = await supabase
        .from("audit_logs")
        .select("*");

      if (error) throw error;

      if (logs && logs.length > 0) {
        // Hourly distribution
        const hourCounts: Record<number, number> = {};
        for (let i = 0; i < 24; i++) hourCounts[i] = 0;
        logs.forEach((log) => {
          const hour = new Date(log.created_at).getHours();
          hourCounts[hour]++;
        });
        setHourlyData(
          Object.entries(hourCounts).map(([hour, count]) => ({
            hour: `${hour}h`,
            count,
          }))
        );

        // Table distribution
        const tableCounts: Record<string, number> = {};
        logs.forEach((log) => {
          tableCounts[log.table_name] = (tableCounts[log.table_name] || 0) + 1;
        });
        setTableData(
          Object.entries(tableCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
        );

        // User activity (top 5)
        const userCounts: Record<string, number> = {};
        logs.forEach((log) => {
          const userId = log.user_id.slice(0, 8);
          userCounts[userId] = (userCounts[userId] || 0) + 1;
        });
        setUserData(
          Object.entries(userCounts)
            .map(([email, count]) => ({ email: `...${email}`, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        );
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-48" />
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade de Acesso</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="hourly">
          <TabsList className="mb-4">
            <TabsTrigger value="hourly">Por Hora</TabsTrigger>
            <TabsTrigger value="tables">Por Tabela</TabsTrigger>
            <TabsTrigger value="users">Usuários Ativos</TabsTrigger>
          </TabsList>

          <TabsContent value="hourly">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="tables">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={tableData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tableData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="users">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={userData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="email" type="category" className="text-xs" width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
