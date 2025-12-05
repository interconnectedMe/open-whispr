#!/usr/bin/env python3
import os
import signal
import subprocess
import gi

gi.require_version("Gtk", "3.0")
gi.require_version("AppIndicator3", "0.1")

from gi.repository import Gtk, AppIndicator3, GLib  # noqa

APP_ID = "openwhispr_mic_indicator"
ICON_RUNNING = "/usr/share/icons/Yaru/scalable/status/audio-input-microphone-high-symbolic.svg"
ICON_STOPPED = "/usr/share/icons/Yaru/scalable/status/audio-input-microphone-muted-symbolic.svg"
PGREP_PATTERN = r"(open-whispr|run-openwhispr)"
EXIT_ON_CLOSE = os.environ.get("OPENWHISPR_TRAY_EXIT_ON_CLOSE", "1").lower() not in (
    "0",
    "false",
)
HIDE_WHEN_INACTIVE = os.environ.get("OPENWHISPR_TRAY_HIDE_WHEN_INACTIVE", "1").lower() not in (
    "0",
    "false",
)


def openwhispr_running() -> bool:
    """Return True if any OpenWhispr-related process exists."""
    try:
        subprocess.check_call(
            ["pgrep", "-f", PGREP_PATTERN],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return True
    except subprocess.CalledProcessError:
        return False


class MicIndicator:
    def __init__(self):
        self.ind = AppIndicator3.Indicator.new(
            APP_ID,
            ICON_RUNNING,
            AppIndicator3.IndicatorCategory.APPLICATION_STATUS,
        )
        self.ind.set_status(AppIndicator3.IndicatorStatus.ACTIVE)

        menu = Gtk.Menu()
        quit_item = Gtk.MenuItem(label="Quit indicator")
        quit_item.connect("activate", self.quit)
        quit_item.show()
        menu.append(quit_item)
        self.ind.set_menu(menu)

        GLib.timeout_add_seconds(3, self.tick)

    def set_running(self):
        self.ind.set_icon(ICON_RUNNING)
        self.ind.set_status(AppIndicator3.IndicatorStatus.ACTIVE)

    def set_stopped(self):
        if HIDE_WHEN_INACTIVE:
            self.ind.set_status(AppIndicator3.IndicatorStatus.PASSIVE)
        else:
            self.ind.set_icon(ICON_STOPPED)
            self.ind.set_status(AppIndicator3.IndicatorStatus.ACTIVE)

    def tick(self):
        if openwhispr_running():
            self.set_running()
            return True

        self.set_stopped()

        if EXIT_ON_CLOSE:
            Gtk.main_quit()
            return False
        return True

    def quit(self, _):
        Gtk.main_quit()


if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal.SIG_DFL)
    MicIndicator()
    Gtk.main()
