/** Parse @Name mentions from team note/comment text */
export function parseMentions(
  text: string,
  members: { userId: string; name: string }[]
): { mentionIds: string[]; mentionNames: string[] } {
  const mentionNames: string[] = [];
  const mentionIds: string[] = [];
  const pattern = /@([A-Za-z][A-Za-z0-9_.\- ]{0,40})/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const raw = match[1].trim();
    const member = members.find(
      (m) => m.name.toLowerCase() === raw.toLowerCase()
    );
    if (member && !mentionIds.includes(member.userId)) {
      mentionIds.push(member.userId);
      mentionNames.push(member.name);
    }
  }

  return { mentionIds, mentionNames };
}

export function highlightMentions(text: string) {
  return text.replace(
    /@([A-Za-z][A-Za-z0-9_.\- ]{0,40})/g,
    '<span class="text-[#F9E076] font-medium">@$1</span>'
  );
}
