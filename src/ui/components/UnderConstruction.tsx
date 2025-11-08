import { IconHammer, IconArrowRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface UnderConstructionProps {
  pageName: string;
  description?: string;
}

export function UnderConstruction({
  pageName,
  description,
}: UnderConstructionProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4 lg:px-6">
      <Card className="max-w-2xl w-full">
        <CardContent className="flex flex-col items-center text-center p-8 md:p-12">
          {/* Icon */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl"></div>
            <div className="relative bg-yellow-500/10 p-6 rounded-full">
              <IconHammer className="h-16 w-16 text-yellow-500 animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{pageName}</h1>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
            </span>
            قيد الإنشاء
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-lg mb-8 max-w-md">
            {description ||
              "نعمل حالياً على تطوير هذه الصفحة. ستكون متاحة قريباً بميزات رائعة!"}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <Link to="/">
                <IconArrowRight className="ml-2 h-4 w-4" />
                العودة للرئيسية
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="wa.me/+96569072509">تواصل معنا</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
