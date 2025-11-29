# -*- coding: utf-8 -*-

# This file is part of Pigeon Planner.
# Parts taken and inspired by Tucan.

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


import gtk
import gobject

from pigeonplanner.core import const
from pigeonplanner.core import update
from pigeonplanner.ui import maildialog
from pigeonplanner.ui.messagedialog import QuestionDialog


class ExceptionDialog(gtk.Dialog):
    def __init__(self, errortext):
        gtk.Dialog.__init__(self)

        self._errortext = errortext
        
        self._create_dialog()
        self._size = self.get_size()
        self.run()
        self.destroy()

    def report_log(self, widget):
        try:
            new, msg = update.update()
        except update.UpdateError as exc:
            new = False
        if new:
            desc = _("Chances are that your problem is already fixed in "
                     "this new version. Send a report anyway?")
            if not QuestionDialog((msg, desc, msg), self).run():
                return
        maildialog.MailDialog(self, const.LOGFILE, "log")

    def on_expander_activate(self, widget):
        def resize_timeout():
            self.resize(*self._size)
            return False
        # Reverse logic, "expanded" property is set *after* this signal
        if widget.get_expanded():
            # Wait a small amount of time to resize. The expander takes a
            # moment to collapse all widgets and resizing won't work until then.
            gobject.timeout_add(100, resize_timeout)

    def _create_dialog(self):
        self.set_title("")
        self.set_has_separator(False)
        self.vbox.set_spacing(4)
        self.set_border_width(12)
        hbox = gtk.HBox()
        hbox.set_spacing(12)
        image = gtk.Image()
        image.set_from_stock(gtk.STOCK_DIALOG_ERROR, gtk.ICON_SIZE_DIALOG)
        label = gtk.Label("<span size=\"larger\" weight=\"bold\">%s</span>"
                          % _("Pigeon Planner has experienced an unexpected error"))
        label.set_use_markup(True)

        hbox.pack_start(image, False)
        hbox.add(label)

        self.vbox.pack_start(hbox, False, False, 4)

        label = gtk.Label(_("You can help the Pigeon Planner "
                            "developers by taking the time to report this bug."))
        label.set_line_wrap(True)
        label.set_use_markup(True)
        label.set_justify(gtk.JUSTIFY_CENTER)

        self.vbox.pack_start(label, False, False, 4)

        textview = gtk.TextView()
        textview.get_buffer().set_text(self._errortext)
        textview.set_border_width(6)
        textview.set_editable(False)
        
        scroll = gtk.ScrolledWindow()
        scroll.set_policy(gtk.POLICY_AUTOMATIC, gtk.POLICY_AUTOMATIC)
        scroll.set_size_request(-1, 240)
        scroll.add(textview)

        expander = gtk.Expander("<b>%s</b>" % _("Error Detail"))
        expander.connect("activate", self.on_expander_activate)
        expander.set_use_markup(True)
        expander.add(scroll)

        self.vbox.pack_start(expander, True, True, 4)

        button_report = gtk.Button(None, "report")
        button_report.connect("clicked", self.report_log)
        self.action_area.pack_start(button_report)
        button_close = gtk.Button(None, gtk.STOCK_CLOSE)
        button_close.connect("clicked", lambda w: self.destroy())
        self.action_area.pack_start(button_close)

        self.show_all()

