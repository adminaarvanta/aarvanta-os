import { ChannelOsDetailPage } from "@/components/channels/channel-os-shell";

export default async function WhatsAppConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChannelOsDetailPage os="whatsapp" id={id} />;
}
