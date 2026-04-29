import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EmotionThemeProvider } from "@notesnook/theme";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { defaultTemplateState } from "./lib/state";
import { serializeFragment } from "./lib/urlState";

const sendToNotesnookMock = vi.hoisted(() => vi.fn());

vi.mock("@notesnook/editor", () => ({
  Icons: {
    pin: "",
    readonlyOn: "",
    readonlyOff: ""
  },
  getHTMLFromFragment: () => "",
  Toolbar: () => createElement("div"),
  usePermissionHandler: () => undefined,
  useTiptap: () => ({
    commands: {
      setContent: vi.fn()
    },
    schema: {},
    state: {
      doc: {
        content: null
      }
    }
  })
}));

vi.mock("./lib/inboxApi", () => ({
  sendToNotesnook: sendToNotesnookMock
}));

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  }
});

function renderApp() {
  return render(
    <EmotionThemeProvider scope="base">
      <App />
    </EmotionThemeProvider>
  );
}

const ui = {
  apiKey: () => screen.getByTestId("api-key-input"),
  copyLink: () => screen.getByTestId("copy-link"),
  editTemplate: () => screen.getByTestId("action-edit-template"),
  includeKey: () => screen.getByTestId("include-key-select"),
  onOpen: () => screen.getByTestId("on-open-select"),
  preview: () => screen.getByTestId("action-preview"),
  resultStatus: () => screen.getByTestId("result-status"),
  send: () => screen.getByTestId("action-send"),
  sendNow: () => screen.getByTestId("action-send-now"),
  shareLink: () => screen.getByTestId("share-link-input"),
  title: () => screen.getByTestId("title-input")
};

function inputValue(element: HTMLElement) {
  return (element as HTMLInputElement | HTMLSelectElement).value;
}

describe("App", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    vi.restoreAllMocks();
    sendToNotesnookMock.mockReset();
    sendToNotesnookMock.mockResolvedValue({ status: "success", httpStatus: 200, responseBody: "{\"success\":true}" });
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("restores form state from the generated link", async () => {
    const firstRender = renderApp();
    await userEvent.type(ui.title(), "Restored");
    await userEvent.click(ui.copyLink());
    const copied = vi.mocked(navigator.clipboard.writeText).mock.calls.at(-1)?.[0] ?? "";
    expect(copied).toContain("#");

    firstRender.unmount();
    window.history.replaceState(null, "", copied);
    renderApp();
    await waitFor(() => expect(ui.title()).toHaveValue("Restored"));
    expect(window.location.hash).toBe("");
  });

  it("reads the fragment once and ignores later hash changes", async () => {
    const firstFragment = serializeFragment({
      apiKey: "",
      includeKey: false,
      template: { ...defaultTemplateState, titleTemplate: "Imported" }
    });
    window.history.replaceState(null, "", `/${firstFragment}`);

    renderApp();
    await waitFor(() => expect(ui.title()).toHaveValue("Imported"));
    expect(window.location.hash).toBe("");

    const laterFragment = serializeFragment({
      apiKey: "",
      includeKey: false,
      template: { ...defaultTemplateState, titleTemplate: "Ignored" }
    });
    window.location.hash = laterFragment;
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    expect(ui.title()).toHaveValue("Imported");
    expect(ui.title()).not.toHaveValue("Ignored");
  });

  it("renders the template before sending", async () => {
    renderApp();
    await userEvent.clear(ui.title());
    await userEvent.type(ui.title(), "Preview Title");
    await userEvent.click(ui.preview());
    expect(await screen.findByTestId("action-send")).toBeInTheDocument();
    expect(ui.editTemplate()).toBeInTheDocument();
    expect(screen.queryByTestId("action-preview")).not.toBeInTheDocument();
    expect(screen.queryByTestId("action-send-now")).not.toBeInTheDocument();
    expect(ui.title()).toHaveValue("Preview Title");
  });

  it("sends without preview by rendering the template first", async () => {
    renderApp();
    await userEvent.type(ui.apiKey(), "key");
    fireEvent.change(ui.title(), { target: { value: "Direct {{ today }}" } });
    await userEvent.click(ui.sendNow());

    await waitFor(() => expect(sendToNotesnookMock).toHaveBeenCalled());
    expect(ui.resultStatus()).toHaveTextContent("Sent");
    expect(screen.queryByTestId("action-preview")).not.toBeInTheDocument();
    expect(screen.queryByTestId("action-send")).not.toBeInTheDocument();
    expect(ui.title()).toBeDisabled();
    expect(inputValue(ui.title())).toMatch(/^Direct \d{4}-\d{2}-\d{2}$/);
  });

  it("updates the generated share link without changing the browser URL", async () => {
    renderApp();
    const browserUrl = window.location.href;
    await userEvent.type(ui.apiKey(), "key");

    await userEvent.selectOptions(ui.onOpen(), "send");
    expect(window.location.href).toBe(browserUrl);
    expect(ui.includeKey()).toHaveValue("yes");
    expect(inputValue(ui.shareLink())).toContain("auto=send");
    expect(inputValue(ui.shareLink())).toContain("k=key");

    await userEvent.selectOptions(ui.includeKey(), "no");
    expect(window.location.href).toBe(browserUrl);
    expect(ui.onOpen()).toHaveValue("");
    expect(inputValue(ui.shareLink())).not.toContain("auto=send");
    expect(inputValue(ui.shareLink())).not.toContain("k=key");
  });

  it("loads a pasted URL into the editor without running its auto action", async () => {
    renderApp();
    const pastedFragment = serializeFragment({
      apiKey: "pasted-key",
      includeKey: true,
      auto: "send",
      template: { ...defaultTemplateState, titleTemplate: "Pasted" }
    });
    const pastedUrl = `${window.location.origin}/${pastedFragment}`;

    fireEvent.paste(ui.shareLink(), {
      clipboardData: {
        getData: () => pastedUrl
      }
    });

    await waitFor(() => expect(ui.title()).toHaveValue("Pasted"));
    expect(ui.apiKey()).toHaveValue("pasted-key");
    expect(ui.includeKey()).toHaveValue("yes");
    expect(ui.onOpen()).toHaveValue("send");
    expect(sendToNotesnookMock).not.toHaveBeenCalled();
    expect(ui.preview()).toBeInTheDocument();
    expect(screen.queryByTestId("result-status")).not.toBeInTheDocument();
  });

  it("loads a manually edited URL on Enter", async () => {
    renderApp();
    const fragment = serializeFragment({
      apiKey: "",
      includeKey: false,
      template: { ...defaultTemplateState, titleTemplate: "Entered" }
    });

    fireEvent.change(ui.shareLink(), { target: { value: `${window.location.origin}/${fragment}` } });
    fireEvent.keyDown(ui.shareLink(), { key: "Enter" });

    await waitFor(() => expect(ui.title()).toHaveValue("Entered"));
  });

  it("initializes share controls from the loaded link state", async () => {
    const fragment = serializeFragment({
      apiKey: "loaded-key",
      includeKey: true,
      auto: "render",
      template: { ...defaultTemplateState, titleTemplate: "Loaded" }
    });
    window.history.replaceState(null, "", `/${fragment}`);

    renderApp();

    await waitFor(() => expect(ui.title()).toHaveValue("Loaded"));
    expect(ui.apiKey()).toHaveValue("loaded-key");
    expect(ui.includeKey()).toHaveValue("yes");
    expect(ui.onOpen()).toHaveValue("render");
    expect(inputValue(ui.shareLink())).toContain("k=loaded-key");
  });

  it("runs startup preview automation from the initial URL", async () => {
    const fragment = serializeFragment({
      apiKey: "",
      includeKey: false,
      auto: "render",
      template: { ...defaultTemplateState, titleTemplate: "Auto preview" }
    });
    window.history.replaceState(null, "", `/${fragment}`);

    renderApp();

    await waitFor(() => expect(ui.send()).toBeInTheDocument());
    expect(ui.title()).toHaveValue("Auto preview");
    expect(sendToNotesnookMock).not.toHaveBeenCalled();
  });

  it("runs startup send automation from the initial URL", async () => {
    const fragment = serializeFragment({
      apiKey: "startup-key",
      includeKey: true,
      auto: "send",
      template: { ...defaultTemplateState, titleTemplate: "Auto send" }
    });
    window.history.replaceState(null, "", `/${fragment}`);

    renderApp();

    await waitFor(() => expect(sendToNotesnookMock).toHaveBeenCalled());
    expect(ui.resultStatus()).toHaveTextContent("Sent");
  });

  it("disables send actions and labels them until a key is entered", async () => {
    renderApp();

    expect(ui.apiKey()).not.toHaveAttribute("aria-invalid");
    expect(ui.apiKey()).toHaveAttribute("type", "password");
    expect(ui.apiKey()).toHaveAttribute("name", "notesnook-inbox-template-sender-key");
    expect(ui.apiKey()).toHaveAttribute("autocomplete", "current-password");
    expect(ui.sendNow()).toBeDisabled();
    expect(ui.sendNow()).toHaveTextContent("(needs key)");

    await userEvent.click(ui.preview());
    await screen.findByTestId("action-send");
    expect(ui.send()).toBeDisabled();
    expect(ui.send()).toHaveTextContent("(needs key)");

    await userEvent.type(ui.apiKey(), "key");
    expect(ui.send()).toBeEnabled();
  });

  it("submits and shows success when fetch succeeds", async () => {
    renderApp();
    await userEvent.type(ui.apiKey(), "key");
    await userEvent.click(ui.preview());
    await screen.findByTestId("action-send");
    await userEvent.click(ui.send());

    await waitFor(() => expect(sendToNotesnookMock).toHaveBeenCalled());
    expect(ui.resultStatus()).toHaveTextContent("Sent");
  });

  it("shows in-flight send state under the action buttons and disables actions", async () => {
    let resolveSend: (value: { status: "success"; httpStatus: number; responseBody: string }) => void = () => undefined;
    sendToNotesnookMock.mockReturnValue(new Promise((resolve) => {
      resolveSend = resolve;
    }));

    renderApp();
    await userEvent.type(ui.apiKey(), "key");
    await userEvent.click(ui.preview());
    await screen.findByTestId("action-send");
    await userEvent.click(ui.send());

    const actionStatus = await screen.findByTestId("action-status");
    expect(actionStatus).toHaveTextContent("Sending");
    expect(actionStatus).toHaveTextContent("Encrypting and sending the note.");
    expect(ui.editTemplate()).toBeDisabled();
    expect(screen.queryByText("Locked after send. Go back to edit.")).not.toBeInTheDocument();

    resolveSend({ status: "success", httpStatus: 200, responseBody: "{\"success\":true}" });
    await waitFor(() => expect(ui.resultStatus()).toHaveTextContent("Sent"));
  });
});
