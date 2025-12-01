# -*- coding: utf-8 -*-

# This file is part of Pigeon Planner.

# Pigeon Planner is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Pigeon Planner is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Pigeon Planner.  If not, see <http://www.gnu.org/licenses/>


import os
import sys
import webbrowser
from threading import Thread
import logging
logger = logging.getLogger()

try:
    import pygtk; pygtk.require("2.0")
except:
    print "The Python GTK (PyGTK) bindings are required to run this program."
    sys.exit(0)

try:
    import gtk
except:
    print "The GTK+ runtime is required to run this program."
    sys.exit(0)

import gobject
gobject.threads_init()

from pigeonplanner.core import const


class GtkLogHandler(logging.Handler):
    def __init__(self):
        logging.Handler.__init__(self)

    def emit(self, record):
        from pigeonplanner.ui import exceptiondialog
        exceptiondialog.ExceptionDialog(record.getMessage())


def setup_icons():
    from pigeonplanner.ui import utils
    # Register custom stock icons
    utils.create_stock_button([
            ("icon_pedigree_detail.png", "pedigree-detail", _("Pedigree")),
            ("icon_email.png", "email", _("E-mail")),
            ("icon_send.png", "send", _("Send")),
            ("icon_report.png", "report", _("Report")),
            ("icon_columns.png", "columns", "columns"),
        ])

    # Set default icon for all windows
    gtk.window_set_default_icon_from_file(os.path.join(const.IMAGEDIR, "icon_logo.png"))

def search_updates():
    from pigeonplanner.core import update
    try:
        new, msg = update.update()
    except update.UpdateError as exc:
        logger.error(exc)
        return

    if new:
        gobject.idle_add(update_dialog)
    else:
        logger.info("AutoUpdate: %s" % msg)

def update_dialog():
    from pigeonplanner import messages
    from pigeonplanner.ui.messagedialog import QuestionDialog

    if QuestionDialog(messages.MSG_UPDATE_NOW).run():
        webbrowser.open(const.DOWNLOADURL)

    return False

def run_ui(dbcode):
    formatter = logging.Formatter(const.LOG_FORMAT)
    handler = GtkLogHandler()
    handler.setFormatter(formatter)
    handler.setLevel(logging.CRITICAL)
    logger.addHandler(handler)

    logger.debug("Python version: %s" % ".".join(map(str, sys.version_info[:3])))
    logger.debug("GTK+ version: %s" % ".".join(map(str, gtk.gtk_version)))
    logger.debug("PyGTK version: %s" % ".".join(map(str, gtk.pygtk_version)))

    setup_icons()

    from pigeonplanner import database
    if dbcode == database.DATABASE_TOO_NEW:
        from pigeonplanner import messages
        from pigeonplanner.ui.messagedialog import ErrorDialog
        ErrorDialog(messages.MSG_NEW_DATABASE)
        sys.exit(0)
    elif dbcode == database.DATABASE_CHANGED:
        from pigeonplanner import messages
        from pigeonplanner.ui.messagedialog import InfoDialog
        InfoDialog(messages.MSG_UPDATED_DATABASE)
    elif dbcode == database.DATABASE_ERROR:
        from pigeonplanner import messages
        from pigeonplanner.ui.messagedialog import ErrorDialog
        ErrorDialog(messages.MSG_ERROR_DATABASE)
        sys.exit(0)

    # Import widgets that are used in GtkBuilder files
    from pigeonplanner.ui.widgets import statusbar
    from pigeonplanner.ui.widgets import checkbutton
    from pigeonplanner.ui.widgets import latlongentry

    from pigeonplanner.ui import mainwindow
    mainwindow.MainWindow()

    from pigeonplanner.core import config
    if config.get("options.check-for-updates"):
        updatethread = Thread(None, search_updates, None)
        updatethread.start()

    gtk.main()

