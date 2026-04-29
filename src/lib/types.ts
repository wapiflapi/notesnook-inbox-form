export type AutoAction = "render" | "send";
export type Stage = "form" | "preview" | "result";

export type TemplateState = {
  titleTemplate: string;
  source: string;
  contentTemplate: string;
  pinned: boolean;
  favorite: boolean;
  readonly: boolean;
  archived: boolean;
  notebookIds: string;
  tagIds: string;
};

export type FragmentState = {
  apiKey: string;
  auto?: AutoAction;
  args: Record<string, string>;
  template: TemplateState;
  parseError?: string;
};

export type RenderedNote = {
  title: string;
  html: string;
  payload: NotesnookInboxPayload;
};

export type NotesnookInboxPayload = {
  title: string;
  type: "note";
  source: string;
  version: 1;
  content: {
    type: "html";
    data: string;
  };
  pinned: boolean;
  favorite: boolean;
  readonly: boolean;
  archived: boolean;
  notebookIds?: string[];
  tagIds?: string[];
};

export type EncryptedInboxItem = {
  v: 1;
  alg: "pgp-aes256";
  cipher: string;
};

export type SendResult =
  | {
      status: "success";
      httpStatus: number;
      responseBody: string;
    }
  | {
      status: "error";
      message: string;
      httpStatus?: number;
      responseBody?: string;
    };
