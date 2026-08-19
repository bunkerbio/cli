import React from "react";
import { render } from "ink";
import { App } from "./App.js";

export async function launchTUI(initialModel?: string): Promise<void> {
  return new Promise((resolve) => {
    const { waitUntilExit } = render(<App initialModel={initialModel} />);
    waitUntilExit().then(() => resolve());
  });
}
