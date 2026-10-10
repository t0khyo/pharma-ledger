const fs = require('fs');

let content = fs.readFileSync('src/ui/pages/Customers.tsx', 'utf8');

content = content.replace(
  'import { useState, useEffect } from "react";',
  'import { useState } from "react";\nimport { useQuery, useQueryClient } from "@tanstack/react-query";'
);

const oldHooksRegex = /  const \[customers, setCustomers\] = useState<Customer\[\]>\(\[\]\);\s*const \[loading, setLoading\] = useState\(true\);/;
content = content.replace(oldHooksRegex, `  const queryClient = useQueryClient();`);

// Remove loadCustomers blocks
const loadCustomersRegex = /  useEffect\(\(\) => \{\s*loadCustomers\(\);\s*\}, \[search, sortBy, sortOrder, lateOnly, lateDays, currentPage\]\);\s*const totalPages = Math\.ceil\(totalCustomers \/ itemsPerPage\);\s*const loadCustomers = async \(\) => \{[\s\S]*?finally \{\s*setLoading\(false\);\s*\}\s*\};\s*/;

const replacement = `  const { data: customerData, isLoading: loading, refetch: loadCustomers } = useQuery({
    queryKey: ['customers', { search, sortBy, sortOrder, lateOnly, lateDays, currentPage }],
    queryFn: async () => {
      const [result, statsResult] = await Promise.all([
        window.api.customers.getAll({ 
          search, sortBy, sortOrder, lateOnly, lateDays,
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage
        }),
        window.api.customers.getStats({ search, lateOnly, lateDays })
      ]);
      
      if (!result.success) throw new Error("Failed to fetch customers");
      
      return {
        customers: result.data || [],
        totalCustomers: result.total || 0,
        stats: statsResult.data || {
          totalCustomers: 0,
          totalDebts: 0,
          totalBalances: 0,
          netBalance: 0,
        }
      };
    }
  });

  const customers = customerData?.customers || [];
  const totalCustomers = customerData?.totalCustomers || 0;
  const stats = customerData?.stats || { totalCustomers: 0, totalDebts: 0, totalBalances: 0, netBalance: 0 };
  const totalPages = Math.ceil(totalCustomers / itemsPerPage);

`;

content = content.replace(loadCustomersRegex, replacement);

const oldStatsStateRegex = /  const \[totalCustomers, setTotalCustomers\] = useState\(0\);\s*const \[stats, setStats\] = useState<CustomerStats>\(\{[\s\S]*?\}\);/;
content = content.replace(oldStatsStateRegex, '');

// Also invalidate queries on success actions:
// handleSave
content = content.replace(
  /        await loadCustomers\(\);\s*setIsDialogOpen\(false\);/g,
  `        await queryClient.invalidateQueries({ queryKey: ['customers'] });
        setIsDialogOpen(false);`
);

// handleDelete
content = content.replace(
  /      const result = await window\.api\.customers\.delete\(id\);\s*if \(result\.success\) \{\s*toast\.success\("تم الحذف بنجاح"\);\s*loadCustomers\(\);\s*\}/,
  `      const result = await window.api.customers.delete(id);
      if (result.success) {
        toast.success("تم الحذف بنجاح");
        await queryClient.invalidateQueries({ queryKey: ['customers'] });
      }`
);

fs.writeFileSync('src/ui/pages/Customers.tsx', content);

