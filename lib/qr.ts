import QRCode from "qrcode";

export function getProfileUrl(siteUrl: string, userId: string) {
  return `${siteUrl.replace(/\/$/, "")}/profile/${userId}`;
}

export async function createProfileQrDataUrl(siteUrl: string, userId: string) {
  return QRCode.toDataURL(getProfileUrl(siteUrl, userId), {
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 6,
  });
}
