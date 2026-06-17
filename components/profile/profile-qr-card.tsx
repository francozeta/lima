import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ProfileQrCard({
  profileUrl,
  qrDataUrl,
}: {
  profileUrl: string;
  qrDataUrl: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>QR de perfil</CardTitle>
        <CardDescription>Compartelo para validar tu identidad.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex aspect-square items-center justify-center rounded-lg border bg-white p-4">
          <Image
            alt="QR del perfil LIMA"
            height={240}
            src={qrDataUrl}
            unoptimized
            width={240}
          />
        </div>
        <p className="break-all text-xs text-muted-foreground">{profileUrl}</p>
      </CardContent>
    </Card>
  );
}
