// Wire types shared between server and clients.

export type LobbyParticipant = {
  id: string;
  nickname: string;
};

export type PublicQuestion = {
  index: number;
  total: number;
  text: string;
  imageUrl: string | null;
  type: "single" | "multiple";
  timeLimit: number;
  points: number;
  options: { id: string; text: string }[];
  startedAt: number; // ms epoch
};

export type LeaderboardEntry = {
  participantId: string;
  nickname: string;
  score: number;
  delta: number;
};

export type QuestionResult = {
  index: number;
  correctOptionIds: string[];
  perOptionCounts: Record<string, number>;
  leaderboard: LeaderboardEntry[];
};

export type FinalResult = {
  leaderboard: LeaderboardEntry[];
};

export interface ServerToClientEvents {
  "lobby:state": (s: { code: string; quizTitle: string; participants: LobbyParticipant[]; status: string }) => void;
  "lobby:participants": (p: LobbyParticipant[]) => void;
  "quiz:question": (q: PublicQuestion) => void;
  "quiz:result": (r: QuestionResult) => void;
  "quiz:final": (f: FinalResult) => void;
  "host:answers": (data: { participantId: string; nickname: string; answeredCount: number; totalParticipants: number }) => void;
  error: (msg: string) => void;
}

export interface ClientToServerEvents {
  "join:participant": (p: { code: string; nickname: string; userId?: string | null }, ack: (r: { ok: boolean; participantId?: string; error?: string }) => void) => void;
  "join:host": (p: { code: string; userId: string }, ack: (r: { ok: boolean; error?: string }) => void) => void;
  "host:next": () => void;
  "host:reveal": () => void;
  "host:finish": () => void;
  "answer:submit": (p: { optionIds: string[] }) => void;
}
