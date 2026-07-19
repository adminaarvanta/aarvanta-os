import { ChannelOsDetailPage } from "@/components/channels/channel-os-shell";

export default async function VoiceConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChannelOsDetailPage os="voice" id={id} />;
}
