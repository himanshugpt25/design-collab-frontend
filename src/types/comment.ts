export interface CommentMention {
  userId?: string;
  username: string;
}

export interface Comment {
  _id: string;
  designId: string;
  authorName: string;
  text: string;
  mentions: CommentMention[];
  createdAt: string;
}

