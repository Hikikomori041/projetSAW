export interface Channel {
  _id: string;
  name: string;
  createdBy?: { _id?: string; username: string } | null;
}

export interface MessageAuthor {
  _id: string;
  username: string;
  banned?: boolean;
}

export interface Message {
  _id: string;
  content: string;
  author?: MessageAuthor | null;
  createdAt: string;
}

export interface DecodedToken {
  username: string;
  role: string;
  sub: string;
}

export interface DeleteModalState {
  type: 'message' | 'channel' | 'ban';
  id: string;
  username?: string;
}

export interface ContextMenuState {
  channelId: string;
  x: number;
  y: number;
}

export interface MessageContextMenuState {
  messageId: string;
  x: number;
  y: number;
}
