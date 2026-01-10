import type { MessageAuthor } from '../types';

export const getAuthorName = (author?: MessageAuthor | null): string => {
  if (!author) return '[supprimé]';
  if (author.banned) return '[supprimé]';
  if (author.username.startsWith('[supprimé')) return '[supprimé]';
  return author.username;
};

export const copyInviteLink = (channelId: string, onSuccess: () => void, onError: () => void): void => {
  const inviteLink = `${window.location.origin}/channels?join=${channelId}`;
  navigator.clipboard.writeText(inviteLink).then(() => {
    onSuccess();
  }).catch(() => {
    onError();
  });
};
