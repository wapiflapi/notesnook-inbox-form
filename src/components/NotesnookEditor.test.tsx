import { render } from "@testing-library/react";
import { mdiFormatBold } from "@mdi/js";
import { Icon } from "@notesnook/ui";
import { describe, expect, it } from "vitest";
import { NotesnookThemeFrame } from "./NotesnookEditor";

describe("NotesnookThemeFrame", () => {
  it("provides the theme values required by Notesnook UI icons", () => {
    const { container } = render(
      <NotesnookThemeFrame>
        <Icon path={mdiFormatBold} size="medium" />
      </NotesnookThemeFrame>
    );

    expect(container.querySelector(".icon")).not.toBeNull();
  });
});
