import { HashRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import Debts from "@/pages/Debts";
import FinancialReports from "@/pages/FinancialReports";
import Customers from "@/pages/Customers";
import Companies from "@/pages/Companies";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="debts" element={<Debts />} />
          <Route path="customers" element={<Customers />} />
          <Route path="reports" element={<FinancialReports />} />
          <Route path="companies" element={<Companies />} />
          {/* <Route path="settings" element={<Settings />} /> */}
          {/* <Route path="search" element={<Search />} /> */}
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
