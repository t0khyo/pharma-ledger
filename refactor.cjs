const fs = require('fs');
let content = fs.readFileSync('src/ui/pages/Home.tsx', 'utf8');

content = content.replace(
  'import { useState, useEffect } from "react";',
  'import { useState } from "react";\nimport { useQuery } from "@tanstack/react-query";'
);

const oldHookBlock = `  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<DailyTrend[]>([]);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(new Date());`;

const newHookBlock = `  const [selectedDate, setSelectedDate] = useState(new Date());`;

content = content.replace(oldHookBlock, newHookBlock);

const loadStatsBlock = `  const getDateRange = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const start = new Date(year, month, 9);
    const end = new Date(year, month + 1, 8);
    const formatLocalDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return \`\${y}-\${m}-\${day}\`;
    };
    return { startISO: formatLocalDate(start), endISO: formatLocalDate(end) };
  };`;

const loadDashboardBlockRegex = /  useEffect\(\(\) => \{[\s\S]*?loadDashboardStats[\s\S]*?finally \{\s*setLoading\(false\);\s*\}\s*\};\s*/m;

const replacement = `  const getDateRange = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const start = new Date(year, month, 9);
    const end = new Date(year, month + 1, 8);
    const formatLocalDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return \`\${y}-\${m}-\${day}\`;
    };
    return { startISO: formatLocalDate(start), endISO: formatLocalDate(end) };
  };

  const range = getDateRange(selectedDate);

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboardStats', range.startISO, range.endISO],
    queryFn: async () => {
      const res = await window.api.transactions.getDashboardStats();
      if (!res.success) throw new Error("Failed to fetch stats");
      return res.data;
    }
  });

  const { data: trends = [], isLoading: isTrendsLoading } = useQuery({
    queryKey: ['dashboardTrends', range.startISO, range.endISO],
    queryFn: async () => {
      const res = await window.api.transactions.getTrend(range.startISO, range.endISO);
      if (!res.success) throw new Error("Failed to fetch trends");
      return res.data || [];
    }
  });

  const { data: alerts = [], isLoading: isAlertsLoading } = useQuery({
    queryKey: ['dashboardAlerts', range.startISO, range.endISO],
    queryFn: async () => {
      const res = await window.api.transactions.getSmartAlerts();
      if (!res.success) throw new Error("Failed to fetch alerts");
      return res.data || [];
    }
  });

  const loading = isStatsLoading || isTrendsLoading || isAlertsLoading;
`;

content = content.replace(loadStatsBlock, '');
content = content.replace(loadDashboardBlockRegex, replacement);
content = content.replace('toast.error("فشل تحميل البيانات");', ''); // Removed from loadDashboardStats

fs.writeFileSync('src/ui/pages/Home.tsx', content);
