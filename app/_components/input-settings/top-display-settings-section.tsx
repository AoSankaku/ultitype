"use client";

import { topDisplayMetricOptions } from "../../_lib/constants";
import { css } from "../../_lib/css-module";
import styles from "../SettingsScreen.module.css";

import type { InputSettingsController } from "./controller";

export function TopDisplaySettingsSection({ controller }: { controller: InputSettingsController }) {
  const { settings, toggleTopDisplayMetric } = controller;

  return (
      <section className={css(styles, "settings-category")} aria-labelledby="top-display-settings">
        <h3 className={css(styles, "settings-category-title")} id="top-display-settings">
          上部表示情報
        </h3>
        <div className={css(styles, "settings-category-list")}>
          <section className={css(styles, "settings-row top-display-settings-row")} aria-labelledby="top-display-setting">
            <div>
              <h4 id="top-display-setting">表示する情報</h4>
              <p>残り時間を外しても、残り時間バーは表示されます。</p>
            </div>
            <div className={css(styles, "top-display-setting-controls")} aria-label="上部表示情報">
              {topDisplayMetricOptions.map((option) => (
                <label className={css(styles, "top-display-option")} key={option.id}>
                  <input
                    checked={settings.topDisplayMetricIds.includes(option.id)}
                    onChange={(event) =>
                      toggleTopDisplayMetric(option.id, event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </section>
        </div>
      </section>
  );
}
