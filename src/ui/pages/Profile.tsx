import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Lock, Save, Shield } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  
  // Profile Form State
  const [profileData, setProfileData] = useState({
    username: "",
    full_name: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Initialize profile data from user context
  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username,
        full_name: user.full_name,
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileData.full_name) {
      toast.error("الاسم الكامل مطلوب");
      return;
    }

    setProfileLoading(true);
    try {
      const result = await window.api.auth.updateProfile(user!.user_id, {
        full_name: profileData.full_name
      });
      
      if (result.success) {
        toast.success("تم تحديث البيانات الشخصية بنجاح");
        // In a real app, we might need to refresh the user context here
        // But since we updated the session in the backend, a reload would reflect changes
        // For now, assume the local state is partial truth
      } else {
        toast.error(result.error || "فشل تحديث البيانات");
      }
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء تحديث البيانات");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("كلمة المرور الجديدة غير متطابقة");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setPasswordLoading(true);
    try {
      const result = await window.api.auth.updatePassword(user!.user_id, newPassword);
      
      if (result.success) {
        toast.success("تم تحديث كلمة المرور بنجاح");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.error || "فشل تحديث كلمة المرور");
      }
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء تحديث كلمة المرور");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">الملف الشخصي</h1>
        <p className="text-muted-foreground mt-2">إدارة حسابك وتحديث بياناتك الشخصية</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Info Card */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              البيانات الشخصية
            </CardTitle>
            <CardDescription>تحديث الاسم الكامل (اسم المستخدم غير قابل للتعديل)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                  id="username"
                  value={profileData.username}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">الاسم الكامل</Label>
                <Input
                  id="full_name"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  placeholder="الاسم الكامل"
                />
              </div>
              <div className="space-y-2">
                <Label>الدور الوظيفي</Label>
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md text-sm border">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {user?.role === "admin" ? "مسؤول النظام (Admin)" : "موظف (Employee)"}
                  </span>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={profileLoading}>
                  {profileLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              تغيير كلمة المرور
            </CardTitle>
            <CardDescription>تعيين كلمة مرور جديدة آمنة لحسابك</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">تأكيد كلمة المرور الجديدة</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" variant="outline" disabled={passwordLoading}>
                  {passwordLoading ? "جاري التحديث..." : (
                    <>
                      <Save className="w-4 h-4 ml-2" />
                      تحديث كلمة المرور
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
