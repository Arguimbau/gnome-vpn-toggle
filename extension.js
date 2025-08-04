const { St, Gio, GLib } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

class VPNToggleExtension {
  constructor() {
    this._indicator = null;
    this._icon = null;
    this._pollId = null;
  }

  enable() {
    this._indicator = new PanelMenu.Button(0.0, "VPN Toggle", false);

    const iconPath = Me.path + "/icons/vpn-off.png";
    const iconFile = Gio.File.new_for_path(iconPath);

    this._icon = new St.Icon({
      gicon: new Gio.FileIcon({ file: iconFile }),
      style_class: "system-status-icon",
    });

    this._indicator.add_child(this._icon);

    this._addConfigToggles();

    // Delay icon update to allow shell to fully initialize
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 50, () => {
      this._updateInitialState();
      return GLib.SOURCE_REMOVE;
    });

    // Add indicator to panel
    Main.panel.addToStatusArea("vpn-toggle", this._indicator, 0, "right");

    // Periodically check VPN status every 20 seconds
    this._pollId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 20, () => {
      this._updateInitialState();
      return GLib.SOURCE_CONTINUE;
    });
  }

  _addConfigToggles() {
    const [ok, out, , status] = GLib.spawn_command_line_sync(
      "sudo -n /usr/bin/ls /etc/wireguard"
    );

    if (!ok || status !== 0 || !out) {
      log("VPN Toggle: Failed to list configs via sudo");
      return;
    }

    const fileList = imports.byteArray.toString(out).trim().split("\n");

    fileList.forEach((name) => {
      if (name.endsWith(".conf")) {
        const baseName = name.replace(".conf", "");
        const isActive = this._isVPNActive(baseName);
        const toggle = new PopupMenu.PopupSwitchMenuItem(baseName, isActive);

        toggle.connect("toggled", () => {
          const cmd = toggle.state
            ? `sudo -n /usr/bin/wg-quick up ${baseName}`
            : `sudo -n /usr/bin/wg-quick down ${baseName}`;
          try {
            GLib.spawn_command_line_async(cmd);
          } catch (e) {
            log(`VPN Toggle Error for ${baseName}: ${e.message}`);
          }
          // Delay checking for status change so interface has time to come up/down
          GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            this._updateInitialState();
            return GLib.SOURCE_REMOVE;
          });
          this._updateInitialState();
        });

        this._indicator.menu.addMenuItem(toggle);
      }
    });
  }

  _updateInitialState() {
    const [ok, out, err, status] =
      GLib.spawn_command_line_sync("sudo -n wg show");

    const output = imports.byteArray.toString(out || []);
    const isActive = ok && output.trim().length > 0;

    log("VPN Toggle: wg show output:\n" + output);

    const iconName = isActive ? "vpn-on.png" : "vpn-off.png";
    const iconPath = Me.path + "/icons/" + iconName;

    try {
      const iconFile = Gio.File.new_for_path(iconPath);
      this._icon.gicon = new Gio.FileIcon({ file: iconFile });
    } catch (e) {
      log("VPN Toggle: Failed to load icon .", "Error", err, "Status:", status);
    }
  }

  _isVPNActive(configName) {
    const [ok, out] = GLib.spawn_command_line_sync(
      `sudo -n wg show ${configName}`
    );
    return ok && out && out.length > 0;
  }

  disable() {
    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }

    if (this._pollId) {
      GLib.source_remove(this._pollId);
      this._pollId = null;
    }
  }
}

function init() {
  return new VPNToggleExtension();
}
