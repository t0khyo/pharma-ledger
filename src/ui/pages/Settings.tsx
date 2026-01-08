import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { EmailSettings } from "../../shared/types/settings.types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Mail, Save, AlertCircle } from "lucide-react";

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<EmailSettings>({
    backup_enabled: "false",
    backup_email_recipient: "",
    backup_email_sender: "Pharma Ledger",
    backup_smtp_host: "smtp.gmail.com",
    backup_smtp_port: "587",
    backup_smtp_user: "",
    backup_smtp_pass: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Use any cast if types aren't fully propagated yet in dev environment
      const data = await (window.api as any).settings.get();
      // Merge with defaults to ensure all fields exist
      setSettings(prev => ({ ...prev, ...data }));
    } catch (error) {
      toast.error("فشل في تحميل الإعدادات");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof EmailSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await (window.api as any).settings.save(settings);
      toast.success("تم حفظ الإعدادات بنجاح");
    } catch (error) {
      toast.error("فشل في حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    setTestError(null);
    try {
      const result = await (window.api as any).settings.testEmail({
        host: settings.backup_smtp_host,
        port: settings.backup_smtp_port,
        user: settings.backup_smtp_user,
        pass: settings.backup_smtp_pass,
        sender: settings.backup_email_sender,
        recipient: settings.backup_email_recipient
      });

      if (result.success) {
        toast.success("تم الإرسال بنجاح!");
      } else {
        const errorMsg = result.error || "خطأ غير معروف";
        setTestError(errorMsg);
        toast.error(`فشل الإرسال`);
      }
    } catch (error) {
      setTestError(String(error));
      toast.error("حدث خطأ أثناء إرسال النسخة الإحتياطية");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 w-full h-full pb-10">
      <div>
        <h1 className="text-3xl font-bold">الإعدادات</h1>
        <p className="text-muted-foreground">تكوين النسخ الاحتياطي عبر البريد الإلكتروني</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle>النسخ الاحتياطي التلقائي</CardTitle>
              <CardDescription>ارسال نسخة من قاعدة البيانات يومياً إلى بريدك الإلكتروني</CardDescription>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Label htmlFor="backup-enabled">تفعيل النسخ الاحتياطي</Label>
              <Switch 
                id="backup-enabled"
                checked={settings.backup_enabled === "true"}
                onCheckedChange={(checked: boolean) => handleChange("backup_enabled", String(checked))}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم المرسل (Sender Name)</Label>
              <Input 
                value={settings.backup_email_sender} 
                onChange={(e) => handleChange("backup_email_sender", e.target.value)}
                placeholder="Pharma Ledger"
              />
            </div>
            <div className="space-y-2">
              <Label>البريد المستقبل (Recipient Email)</Label>
              <Input 
                value={settings.backup_email_recipient} 
                onChange={(e) => handleChange("backup_email_recipient", e.target.value)}
                placeholder="your-email@example.com"
                className="direction-ltr text-left"
              />
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
             <h3 className="font-semibold mb-4 text-sm text-muted-foreground">إعدادات خادوم البريد SMTP</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>المضيف (SMTP Host)</Label>
                 <Input 
                   value={settings.backup_smtp_host} 
                   onChange={(e) => handleChange("backup_smtp_host", e.target.value)}
                   placeholder="smtp.gmail.com"
                   className="direction-ltr text-left"
                 />
               </div>
               <div className="space-y-2">
                 <Label>المنفذ (Port)</Label>
                 <Input 
                   value={settings.backup_smtp_port} 
                   onChange={(e) => handleChange("backup_smtp_port", e.target.value)}
                   placeholder="587"
                   className="direction-ltr text-left"
                 />
               </div>
               <div className="space-y-2">
                 <Label>اسم المستخدم / البريد (User)</Label>
                 <Input 
                   value={settings.backup_smtp_user} 
                   onChange={(e) => handleChange("backup_smtp_user", e.target.value)}
                   placeholder="sender@gmail.com"
                   className="direction-ltr text-left"
                 />
               </div>
               <div className="space-y-2">
                 <Label>كلمة المرور / App Password</Label>
                 <Input 
                   type="password"
                   value={settings.backup_smtp_pass} 
                   onChange={(e) => handleChange("backup_smtp_pass", e.target.value)}
                   placeholder="••••••••"
                   className="direction-ltr text-left"
                 />
               </div>
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={handleTestEmail} disabled={testing || !settings.backup_smtp_user}>
              إرسال نسخة احتياطية
              {testing ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Mail className="w-4 h-4 ml-2" />}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              حفظ الإعدادات
              {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
            </Button>
          </div>
          
          {testError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>فشل الاتصال</AlertTitle>
              <AlertDescription className="dir-ltr text-left font-mono text-xs mt-1">
                {testError}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
