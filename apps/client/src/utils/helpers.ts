import type { MessageAuthor } from '../types';

export const getAuthorName = (author?: MessageAuthor | null): string => {
  if (!author) return '[supprimé]';
  if (author.banned) return '[supprimé]';
  if (author.username.startsWith('[supprimé')) return '[supprimé]';
  return author.username;
};

export const copyInviteLink = (channelId: string): void => {
  const inviteLink = `${window.location.origin}/channels?join=${channelId}`;
  navigator.clipboard.writeText(inviteLink).then(() => {
    alert('Lien d\'invitation copié dans le presse-papier !');
  }).catch(() => {
    alert('Erreur lors de la copie du lien');
  });
};
