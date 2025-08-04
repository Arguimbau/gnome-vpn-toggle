# VPN Toggle GNOME Extension

A GNOME Shell extension that adds a toggleable icon to the top bar for enabling and disabling WireGuard VPNs from `/etc/wireguard/`.

## Features

- Detects all `.conf` files in `/etc/wireguard/`
- Toggles WireGuard VPNs using `wg-quick`
- Updates the icon based on VPN status
- Automatically refreshes VPN status every 20 seconds
- No need to open the terminal once configured

## Installation

1. Clone or download the extension into your local GNOME extensions directory:

   ```bash
   mkdir -p ~/.local/share/gnome-shell/extensions
   cp -r vpn-toggle@yourname ~/.local/share/gnome-shell/extensions/
   ```

2. Enable the extension:

   ```bash
   gnome-extensions enable vpn-toggle@yourname
   ```

3. Restart GNOME Shell:

   - On X11: Press `Alt + F2`, type `r`, press Enter  
   - On Wayland: Restart PC

## Sudo Permissions Setup

Because the extension uses `wg-quick` and accesses `/etc/wireguard/`, you need to allow passwordless execution for those commands.

1. Open the sudoers file using visudo:

   ```bash
   sudo visudo
   ```

2. Add the following line at the bottom (replace `bigballer` with your actual username):

   ```bash
   <Your Username> ALL=(ALL) NOPASSWD: /usr/bin/wg-quick up *, /usr/bin/wg-quick down *

   <Your Username> ALL=(ALL) NOPASSWD: /usr/bin/ls --color=auto /etc/wireguard

   ```